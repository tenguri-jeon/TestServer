import express from 'express';
import cors from 'cors';
import fs from'fs';
import path from 'path';
import { fileURLToPath } from 'url';

var app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// ES 모듈에서는 __dirname 대신 아래 코드를 사용해야 합니다.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFilePath = path.join(__dirname, 'notes.json');

// 데이터 파일이 존재하지 않으면 빈 배열로 초기화
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify([]));
}

// 데이터 조회
app.get('/', cors(), (req, res) => {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Database error');
        }

        // 파일에서 데이터를 읽어와 JSON으로 변환
        const notes = JSON.parse(data);
        res.json(notes);
    });
});

// 데이터 추가
app.post('/add-note', cors(), (req, res) => {
    const { title, content, date ,id} = req.body;

    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Failed to read data');
        }

        const notes = JSON.parse(data);

        const newNote = { 
            title, 
            content, 
            date, 
            id,
        };

        notes.push(newNote);

        fs.writeFile(dataFilePath, JSON.stringify(notes, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Failed to save data');
            }
            res.status(201).json(newNote);  
        });
    });
});


// 데이터 삭제
app.delete('/delete-note/:id', cors(), (req, res) => {
    const noteId = req.params.id;

    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Failed to read data');
        }

        let notes = JSON.parse(data);
        notes = notes.filter(note => note.id !== parseInt(noteId));

        // 수정된 데이터 파일에 저장
        fs.writeFile(dataFilePath, JSON.stringify(notes, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Failed to delete data');
            }
            res.status(200).json({ message: 'Note deleted successfully', id: noteId });
        });
    });
});

// 데이터 수정
app.put('/edit-notes/:id', cors(), (req, res) => {
    const noteId = req.params.id;
    const { title, content, date } = req.body;

    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Failed to read data');
        }

        let notes = JSON.parse(data);
        const noteIndex = notes.findIndex(note => note.id === parseInt(noteId));

        if (noteIndex === -1) {
            return res.status(404).send('Note not found');
        }

        // 해당 노트 수정
        notes[noteIndex] = { id: parseInt(noteId), title, content, date };

        // 수정된 데이터 파일에 저장
        fs.writeFile(dataFilePath, JSON.stringify(notes, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Failed to update data');
            }
            res.status(200).json(notes[noteIndex]);
        });
    });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`);
});
