require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { 
  S3Client, 
  ListBucketsCommand, 
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('public'));

// 測試 S3 連線
app.post('/api/test-connection', async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region } = req.body;

    // 建立 S3 客戶端
    const s3Client = new S3Client({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      }
    });

    // 嘗試列出 buckets 來測試連線
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    res.json({
      success: true,
      message: '連線成功！',
      bucketsCount: response.Buckets.length,
      buckets: response.Buckets.map(b => b.Name)
    });

  } catch (error) {
    console.error('S3 連線錯誤:', error);
    res.status(400).json({
      success: false,
      message: '連線失敗',
      error: error.message
    });
  }
});

// 列出 bucket 中的檔案
app.post('/api/list-objects', async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, bucketName } = req.body;

    const s3Client = new S3Client({
      region: region,
      credentials: { accessKeyId, secretAccessKey }
    });

    const command = new ListObjectsV2Command({
      Bucket: bucketName
    });
    
    const response = await s3Client.send(command);

    res.json({
      success: true,
      objects: response.Contents || [],
      count: response.KeyCount || 0
    });

  } catch (error) {
    console.error('列出檔案錯誤:', error);
    res.status(400).json({
      success: false,
      message: '列出檔案失敗',
      error: error.message
    });
  }
});

// 上傳檔案
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, bucketName } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: '沒有選擇檔案'
      });
    }

    const s3Client = new S3Client({
      region: region,
      credentials: { accessKeyId, secretAccessKey }
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype
    });

    await s3Client.send(command);

    res.json({
      success: true,
      message: '檔案上傳成功',
      fileName: file.originalname
    });

  } catch (error) {
    console.error('上傳檔案錯誤:', error);
    res.status(400).json({
      success: false,
      message: '上傳失敗',
      error: error.message
    });
  }
});

// 下載檔案（產生預簽名 URL）
app.post('/api/download', async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, bucketName, fileName } = req.body;

    const s3Client = new S3Client({
      region: region,
      credentials: { accessKeyId, secretAccessKey }
    });

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      success: true,
      url: url
    });

  } catch (error) {
    console.error('下載檔案錯誤:', error);
    res.status(400).json({
      success: false,
      message: '下載失敗',
      error: error.message
    });
  }
});

// 刪除檔案
app.post('/api/delete', async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, bucketName, fileName } = req.body;

    const s3Client = new S3Client({
      region: region,
      credentials: { accessKeyId, secretAccessKey }
    });

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName
    });

    await s3Client.send(command);

    res.json({
      success: true,
      message: '檔案刪除成功'
    });

  } catch (error) {
    console.error('刪除檔案錯誤:', error);
    res.status(400).json({
      success: false,
      message: '刪除失敗',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
});
