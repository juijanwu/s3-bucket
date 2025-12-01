let credentials = null;
let selectedBucket = null;

const connectionForm = document.getElementById('connectionForm');
const connectionResult = document.getElementById('connectionResult');
const bucketsCard = document.getElementById('bucketsCard');
const bucketsList = document.getElementById('bucketsList');
const filesCard = document.getElementById('filesCard');
const currentBucketSpan = document.getElementById('currentBucket');
const filesList = document.getElementById('filesList');
const filesLoading = document.getElementById('filesLoading');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const selectedFileName = document.getElementById('selectedFileName');
const refreshBtn = document.getElementById('refreshBtn');

// 連接 S3
connectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    credentials = {
        accessKeyId: document.getElementById('accessKeyId').value,
        secretAccessKey: document.getElementById('secretAccessKey').value,
        region: document.getElementById('region').value
    };

    try {
        const response = await fetch('/api/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        connectionResult.classList.remove('hidden');
        
        if (data.success) {
            connectionResult.className = 'result success';
            connectionResult.innerHTML = `<h3>✅ ${data.message}</h3>`;
            
            // 顯示 buckets
            bucketsCard.classList.remove('hidden');
            displayBuckets(data.buckets);
        } else {
            connectionResult.className = 'result error';
            connectionResult.innerHTML = `<h3>❌ ${data.message}</h3><p>${data.error}</p>`;
        }

    } catch (error) {
        connectionResult.classList.remove('hidden');
        connectionResult.className = 'result error';
        connectionResult.innerHTML = `<h3>❌ 連線失敗</h3><p>${error.message}</p>`;
    }
});

// 顯示 buckets
function displayBuckets(buckets) {
    bucketsList.innerHTML = '';
    buckets.forEach(bucket => {
        const div = document.createElement('div');
        div.className = 'bucket-item';
        div.textContent = bucket;
        div.onclick = () => selectBucket(bucket);
        bucketsList.appendChild(div);
    });
}

// 選擇 bucket
function selectBucket(bucket) {
    selectedBucket = bucket;
    currentBucketSpan.textContent = bucket;
    filesCard.classList.remove('hidden');
    
    // 更新選中狀態
    document.querySelectorAll('.bucket-item').forEach(item => {
        item.classList.remove('selected');
        if (item.textContent === bucket) {
            item.classList.add('selected');
        }
    });
    
    loadFiles();
}

// 載入檔案列表
async function loadFiles() {
    filesLoading.classList.remove('hidden');
    filesList.innerHTML = '';

    try {
        const response = await fetch('/api/list-objects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...credentials,
                bucketName: selectedBucket
            })
        });

        const data = await response.json();
        filesLoading.classList.add('hidden');

        if (data.success) {
            displayFiles(data.objects);
        } else {
            filesList.innerHTML = `<p class="error">載入失敗: ${data.error}</p>`;
        }

    } catch (error) {
        filesLoading.classList.add('hidden');
        filesList.innerHTML = `<p class="error">載入失敗: ${error.message}</p>`;
    }
}

// 顯示檔案列表
function displayFiles(objects) {
    if (objects.length === 0) {
        filesList.innerHTML = '<p>此 bucket 是空的</p>';
        return;
    }

    filesList.innerHTML = '';
    objects.forEach(obj => {
        const div = document.createElement('div');
        div.className = 'file-item';
        
        const fileSize = (obj.Size / 1024).toFixed(2);
        
        div.innerHTML = `
            <div class="file-info">
                <div class="file-name">${obj.Key}</div>
                <div class="file-size">${fileSize} KB</div>
            </div>
            <div class="file-actions">
                <button onclick="downloadFile('${obj.Key}')">下載</button>
                <button class="btn-danger" onclick="deleteFile('${obj.Key}')">刪除</button>
            </div>
        `;
        
        filesList.appendChild(div);
    });
}

// 選擇檔案
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        selectedFileName.textContent = `已選擇: ${file.name}`;
        uploadBtn.classList.remove('hidden');
    }
});

// 上傳檔案
uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('accessKeyId', credentials.accessKeyId);
    formData.append('secretAccessKey', credentials.secretAccessKey);
    formData.append('region', credentials.region);
    formData.append('bucketName', selectedBucket);

    uploadBtn.disabled = true;
    uploadBtn.textContent = '上傳中...';

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ ' + data.message);
            fileInput.value = '';
            selectedFileName.textContent = '';
            uploadBtn.classList.add('hidden');
            loadFiles();
        } else {
            alert('❌ ' + data.message);
        }

    } catch (error) {
        alert('❌ 上傳失敗: ' + error.message);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = '上傳';
    }
});

// 下載檔案
async function downloadFile(fileName) {
    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...credentials,
                bucketName: selectedBucket,
                fileName: fileName
            })
        });

        const data = await response.json();

        if (data.success) {
            window.open(data.url, '_blank');
        } else {
            alert('❌ 下載失敗: ' + data.message);
        }

    } catch (error) {
        alert('❌ 下載失敗: ' + error.message);
    }
}

// 刪除檔案
async function deleteFile(fileName) {
    if (!confirm(`確定要刪除 ${fileName} 嗎？`)) {
        return;
    }

    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...credentials,
                bucketName: selectedBucket,
                fileName: fileName
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ ' + data.message);
            loadFiles();
        } else {
            alert('❌ ' + data.message);
        }

    } catch (error) {
        alert('❌ 刪除失敗: ' + error.message);
    }
}

// 重新整理
refreshBtn.addEventListener('click', loadFiles);
