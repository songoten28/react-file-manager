const fs = require('fs').promises;
const path = require('path');
const FileSystem = require("../models/FileSystem.model");
const folderSavePath = require("./folder.config");
const getMimeType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.txt': 'text/plain',
        '.pdf': 'application/pdf',
        '.js': 'application/javascript',   // JavaScript
        '.mp4': 'video/mp4',              // Video MP4
        '.mkv': 'video/x-matroska',       // Matroska Video
        '.mp3': 'audio/mpeg',             // Audio MP3
        '.m4a': 'audio/mp4',              // Audio M4A
        '.wav': 'audio/wav',              // Audio WAV
        '.ogg': 'audio/ogg',              // Audio OGG
        '.webm': 'video/webm',            // Video WebM
        '.gif': 'image/gif',              // GIF Image
        '.html': 'text/html',             // HTML
        '.css': 'text/css',               // CSS
        '.json': 'application/json',      // JSON
        '.zip': 'application/zip',        // ZIP archive
        '.rar': 'application/x-rar-compressed', // RAR archive
    };
    return mimeTypes[ext] || 'application/octet-stream';
};

// Hàm quét thư mục và lưu vào MongoDB
async function scanAndSaveDirectory(dirPath, parentId = null) {
    try {
        // Đọc toàn bộ nội dung thư mục
        const items = await fs.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            const relativePath = fullPath.replace(folderSavePath, ''); // Chuẩn hóa đường dẫn
            const stats = await fs.stat(fullPath);

            // Tạo document cho file hoặc thư mục
            const newFile = new FileSystem({
                name: item.name,
                isDirectory: item.isDirectory(),
                path: relativePath,
                parentId,
                size: !item.isDirectory() ? stats.size : null,
                mimeType: !item.isDirectory() ? getMimeType(item.name) : null,
            });

            // Lưu vào MongoDB
            const savedFile = await newFile.save();
            console.log(`Đã lưu: ${relativePath}`);

            // Nếu là thư mục, quét đệ quy
            if (item.isDirectory()) {
                await scanAndSaveDirectory(fullPath, savedFile._id);
            }
        }
    } catch (error) {
        console.error('Lỗi khi quét thư mục:', error);
    }
}

const startScan = async (rootPath) => {
    try {
        await FileSystem.collection.drop();
    } catch (e){

    }
    // Tạo thư mục gốc trước (nếu cần)
    const rootStat = await fs.stat(rootPath);
    const rootData = {
        name: path.basename(rootPath),
        isDirectory: true,
        path: '/',
        parentId: null,
        createdAt: rootStat.birthtime,
        updatedAt: rootStat.mtime,
    };

    const rootFolder = new FileSystem(rootData);
    const savedRoot = await rootFolder.save();
    console.log(`Đã lưu thư mục gốc: ${rootPath}`);

    // Quét và lưu toàn bộ thư mục con
    await scanAndSaveDirectory(rootPath, savedRoot._id);

    // Đóng kết nối MongoDB sau khi hoàn tất
    console.log('Hoàn tất và đóng kết nối MongoDB');
}

module.exports = startScan