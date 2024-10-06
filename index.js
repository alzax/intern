const express = require('express');
const cors = require('cors');
const { Client } = require('ssh2');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Увеличиваем лимит тела запроса

// Асинхронная функция для загрузки файла через SFTP
const uploadFileViaSFTP = async (sftp, remoteFilePath, code) => {
  return new Promise((resolve, reject) => {
    sftp.writeFile(remoteFilePath, code, (err) => {
      if (err) {
        reject(new Error('Ошибка при записи файла на сервере: ' + err.message));
      } else {
        resolve('Файл успешно загружен на сервер.');
      }
    });
  });
};

app.post('/upload', async (req, res) => {
  const { code, serverIp, username, privateKey, projectFolder, filename } = req.body;

  // Проверка на наличие всех необходимых данных
  if (!code || !serverIp || !username || !privateKey || !projectFolder || !filename) {
    return res.status(400).json({ message: 'Отсутствуют необходимые данные для подключения.' });
  }

  const conn = new Client();

  conn
    .on('ready', () => {
      console.log('SSH-соединение установлено.');

      conn.sftp(async (err, sftp) => {
        if (err) {
          console.error('Ошибка при установлении SFTP-сессии:', err);
          conn.end();
          return res.status(500).json({ message: 'Ошибка при установлении SFTP-сессии.' });
        }

        const remoteFilePath = `${projectFolder}/${filename}`;

        try {
          const uploadMessage = await uploadFileViaSFTP(sftp, remoteFilePath, code);
          console.log(uploadMessage);
          res.json({ message: uploadMessage });
        } catch (uploadError) {
          console.error(uploadError.message);
          res.status(500).json({ message: uploadError.message });
        } finally {
          conn.end();
        }
      });
    })
    .on('error', (err) => {
      console.error('Ошибка SSH-соединения:', err);
      res.status(500).json({ message: 'Ошибка SSH-соединения. Проверьте правильность данных для подключения.' });
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
