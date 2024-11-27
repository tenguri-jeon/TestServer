import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// MySQL 연결
const connection = mysql.createConnection({
    host: 'localhost',  
    port: 3306,       
    user: 'root',
    password: '12345',
    database: 'note'
});

connection.connect((err) => {
    if (err) {
        console.error('MySQL 연결 오류:', err.stack);
        return;
    }
    console.log('MySQL에 연결되었습니다! ID:', connection.threadId);
});

// 연결 상태를 체크하고, 연결이 끊어졌으면 다시 연결하는 로직 추가
function ensureConnection() {
    if (connection.state === 'disconnected') {
        connection.connect((err) => {
            if (err) {
                console.error('MySQL 연결 오류:', err.stack);
                return;
            }
            console.log('MySQL에 연결되었습니다! ID:', connection.threadId);
        });
    }
}

// 데이터 조회
app.get('/', (req, res) => {
    ensureConnection(); // 연결 상태 확인
    const query = 'SELECT * FROM noteProject';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send(`Database error: ${err.message}`); 
        }

        // 날짜를 YYYY-MM-DD 형식으로 포맷
        const formattedResults = results.map(note => {
            const date = new Date(note.date);
            note.date = date.toISOString().split('T')[0]; // 날짜만 반환 (시간 제외)
            return note;
        });

        res.json(formattedResults); // 포맷된 결과 반환
    });
});

// 데이터 삭제
app.delete('/delete-note/:id', (req, res) => {
    const noteId = req.params.id;

    const query = 'DELETE FROM noteProject WHERE id = ?';
    connection.query(query, [noteId], (err, result) => {
        if (err) {
            console.error('삭제 오류:', err);
            return res.status(500).json({ error: '삭제 실패', details: err });
        }
        res.status(200).json({ message: '노트 삭제 성공', id: noteId });
    });
});

// 노트 추가하는 API
app.post('/add-note', (req, res) => {
    const { title, content, date } = req.body;

    const query = 'INSERT INTO noteProject (title, content, date) VALUES (?, ?, ?)';
    connection.query(query, [title, content, date], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Failed to insert data');
        }

        const newNote = {
            id: result.insertId,
            title,
            content,
            date,
        };

        res.status(201).json(newNote);
    });
});

// 데이터 수정
app.put('/edit-notes/:id', (req, res) => {
    const { id } = req.params;
    const { title, content, date } = req.body;

    const query = 'UPDATE noteProject SET title = ?, content = ?, date = ? WHERE id = ?';

    connection.query(query, [title, content, date, id], (err, result) => {
        if (err) {
            console.log('수정 오류:', err);
            return res.status(500).send('Failed to update note');
        }

        res.status(200).json({
            id,
            title,
            content,
            date,
        });
    });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
});

// 서버 종료 시 연결 종료
process.on('SIGINT', () => {
    connection.end((err) => {
        if (err) {
            console.error('MySQL 연결 종료 오류:', err.stack);
        } else {
            console.log('MySQL 연결이 종료되었습니다.');
        }
        process.exit();
    });
});
