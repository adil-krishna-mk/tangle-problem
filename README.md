# TangleScan AI

TangleScan AI is a fun, browser-based web app that lets you upload or capture a photo of tangled headphones or earphones and get an AI-generated verdict about how chaotic the cable situation is.

It uses the Google Gemini Vision API in the browser to analyze the image and then returns:

- whether the image contains headphones or cables
- a complexity score from 1–100
- a level label such as Barely There, Getting Messy, Full Chaos, Diabolical Knot, or Lovecraftian Horror
- a roast-style one-liner
- an estimated knot count and untangle time

## Features

- Upload an image from your device
- Capture a photo using the camera
- Drag-and-drop image support
- AI analysis powered by Gemini Vision
- Animated loading/progress experience
- Shareable result output

## Project Structure

- `index.html` — app structure and UI
- `style.css` — styles and layout
- `app.js` — app logic, camera handling, upload flow, and Gemini API interaction

## How to Run

Because this is a front-end app, you can run it using any simple local web server.

### Option 1: Python

```bash
cd "tinker hub project"
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 2: VS Code Live Server

Open the project in VS Code and launch with a local static server extension such as Live Server.

## How to Use

1. Open the app in your browser.
2. Enter your Gemini API key in the input field.
3. Upload a photo of your tangled headphones or use the camera.
4. Click `Analyze the Chaos`.
5. View the AI-generated verdict and recommendations.

## API Key

You can get a free Gemini API key from Google AI Studio:

https://aistudio.google.com/app/apikey

The app expects the API key to be entered in the browser before analysis begins.

## Notes

- The app is a static front-end project and does not require a backend server.
- Images are processed directly in the browser and sent to Gemini from the client side.
- The app supports PNG, JPG, and WEBP images up to 10MB.

## Disclaimer

This project is built for fun demo purposes and is intended to showcase browser-based AI image analysis with a humorous twist.
