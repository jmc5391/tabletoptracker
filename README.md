# Tabletop Tracker
Tabletop Tracker is a web app for tabletop gamers to communicate and organize competitive events. My project addresses the problems experienced by players and event coordinators when using solutions such as shared spreadsheets and communication apps to schedule matches and record results. The app is designed to streamline and simplify the process by providing a central location where players can record their results and view upcoming games, past scores, and event-wide information such as the current standings for their events.

## Prerequisites
1. **Python 3.10+**  
2. **Git**

## Initial Setup
1. **Clone the repository**
2. **Create and activate virtual environment**
3. **Install requirements.txt**
4. **Setup .env file**
5. **Initialize and upgrade the local database**
6. **Front end setup**

## Running the App
1. **Start the backend: flask run**
2. **In another terminal, start the frontend:**
~~~
cd tabletoptracker-frontend
npm run dev
~~~
3. **Open http://localhost:5173/**


## Environment Variable Setup
Create an .env file in your local repository like this:
~~~
FLASK_APP=run.py
FLASK_ENV=development
DATABASE_URL=sqlite:///dev.db
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
~~~

## Initialize and Upgrade Database
After cloning the codebase and installing requirements:
~~~
flask db upgrade
~~~

## Frontend Setup (React + Vite)
Run the following commands to install the required packages:
~~~
cd tabletoptracker-frontend
npm install
~~~