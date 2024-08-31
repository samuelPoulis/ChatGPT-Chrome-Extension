# ChatGPT-Chrome-Extension

How to use pre production extension:
  - Create a folder named GPTChrome and download all files into that folder
  - Download the files and open them in VScode or any other editor
  - Create a file named .env and create a variable inside this folder called OPENAI_API_KEY
  - Get your API key from OpenAI's website and set OPENAI_API_KEY="your api key"
  - Navigate to ../GPTChrome/backend
  - run command "node server.js" to start the local server
  - Open another terminal and navigate to the main directory (../GPTChrome)
  - run command "npm run build"
  - Go to Google Chrome, click on extensions on the top right, then click manage extensions
  - Check developer mode on the top right of the screen
  - Select Load Unpacked on the top left of the screen
  - Load the dist folder from the GPTChrome folder




Current functionality:
  - Allows users to talk to GPT-4o Mini directly on any page



Planned Features:
  - Will allow users to chat with GPT about the page they are currently viewing
  - Allow users to chat with GPT about youtube videos they are watching
  - Allow users to use voice with AI to chat about they page/video they are viewing
  - Give users the ability to choose more than one model, Claude, GPT-4o, Grok, ect.
