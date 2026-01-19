
# Smart College Chatbot - Portable Setup

This version of the project is configured for maximum portability. The API key is managed via a local file.

## How to use your API Key
1. Locate the `.env` file in the root directory.
2. Open it with any text editor.
3. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Google Gemini API key.
4. Save the file.

## Moving to another host
Because the key is stored in the `.env` file:
- **For local dev**: Just run `npm run dev`.
- **For VPS/Other hosts**: Simply copy the entire project folder. As long as the `.env` file is present during the `npm run build` process, the chatbot will have its key.
- **Security Note**: If you push this to a public GitHub repository, remember that anyone can see your key in the `.env` file. For private hosting, this is perfectly fine and very convenient.

## Commands
- `npm install` : Install requirements.
- `npm run dev` : Start the portable chatbot locally.
- `npm run build`: Build the project for deployment (the key from `.env` will be included in the build).
