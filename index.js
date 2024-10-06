const express = require('express');
const cors = require('cors');
const { Client } = require('ssh2');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит тела запроса

app.post('/upload', (req, res) => {
  const { code, serverIp, username, privateKey, projectFolder, filename } = req.body;

  if (!code || !serverIp || !username || !privateKey || !projectFolder || !filename) {
    return res.status(400).json({ message: 'Отсутствуют необходимые данные для подключения.' });
  }

  const conn = new Client();

  conn
    .on('ready', () => {
      console.log('SSH-соединение установлено.');

      conn.sftp((err, sftp) => {
        if (err) {
          console.error('Ошибка при установлении SFTP-сессии:', err);
          conn.end();
          return res.status(500).json({ message: 'Ошибка при установлении SFTP-сессии.' });
        }

        const remoteFilePath = `${projectFolder}/${filename}`;

        sftp.writeFile(remoteFilePath, code, (err) => {
          if (err) {
            console.error('Ошибка при записи файла на сервере:', err);
            conn.end();
            return res.status(500).json({ message: 'Ошибка при записи файла на сервере.' });
          }

          console.log('Файл успешно загружен на сервер.');
          res.json({ message: 'Код успешно загружен на сервер по SSH.' });
          conn.end();
        });
      });
    })
    .on('error', (err) => {
      console.error('Ошибка SSH-соединения:', err);
      res.status(500).json({ message: 'Ошибка SSH-соединения.' });
    })
    .connect({
      host: serverIp,
      port: 22,
      username: username,
      privateKey: privateKey
    });
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});