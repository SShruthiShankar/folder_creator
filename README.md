# Series Folder Creator

A Vercel-ready React + Vite web app that creates a parent folder for each entered series and optional editable subfolders. Defaults: Photography, AI, and 2D.

## Local use

```bash
npm install
npm run dev
```

## Production check

```bash
npm run build
npm run preview
```

## Deploy to Vercel

### Git method
1. Create a GitHub repository and upload this project.
2. In Vercel, choose **Add New > Project**.
3. Import the repository.
4. Vercel should detect Vite automatically. Build command: `npm run build`; output: `dist`.
5. Select **Deploy**.

### CLI method

```bash
npm install -g vercel
vercel
vercel --prod
```

## Browser behavior

Direct folder creation uses the File System Access API. Use a compatible desktop Chromium browser such as Microsoft Edge or Google Chrome. The user chooses the destination folder after pressing **Choose Location & Create Folders**. In unsupported browsers, the app downloads `folder-structure.txt` instead.

To target SharePoint without API integration, sync the SharePoint document library to the computer and choose that synced folder in the browser picker.
