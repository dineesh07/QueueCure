# 🏥 QueueCure

QueueCure is a modern, real-time medical queue management system designed to optimize patient waiting experiences and streamline clinic workflows. With live dashboard updates, priority tokens, and patient-facing status screens accessible via QR codes, it replaces traditional queues with a seamless digital solution.

---

## ✨ Features

- **📺 Live Queue Workspace**: Receptionists can issue tickets, toggle priority statuses (for emergencies/senior citizens), and manage waiting queues.
- **📱 Patient-Facing QR Codes**: Each doctor has a unique QR code. Patients scan the code to monitor their live queue position, status, and estimated wait times on their own mobile devices.
- **⚡ Real-Time Synchronization**: Backed by Socket.io, any update in the reception control room (adding patients, calling next, skipping, or completing a visit) is broadcasted instantly to all screens.
- **💬 WhatsApp Notifications**: (Optional) Automated updates to keep patients notified of their status.
- **↩️ Single-Click Undo Action**: Receptionists can undo queue operations (like accidentally calling or skipping a patient) within a 5-second grace window.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Modern CSS with clean glassmorphic components
- **Icons**: Lucide React
- **Real-time**: Socket.io Client
- **QR Codes**: `qrcode.react`

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io Server

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your local machine:
- **Node.js** (v16 or higher)
- **MongoDB** (Local instance or Atlas connection URI)

### ⚙️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dineesh07/QueueCure.git
   cd QueueCure
   ```

2. **Install all dependencies**:
   Run the following command at the root directory to install packages for the root, client, and server:
   ```bash
   npm install
   npm install --prefix client
   ```

### 🔑 Environment Variables Setup

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_key
# WhatsApp API configuration (if applicable)
```

Create a `.env` file in the `client` directory (optional, if overriding defaults):
```env
VITE_API_URL=http://localhost:5000
```

---

## 🏃 Run the Application

You can launch both the frontend client and the backend server concurrently using the command from the root directory:

```bash
npm run dev
```

- **Frontend Client**: Runs at `http://localhost:5173` (or the port Vite allocates)
- **Backend Server**: Runs at `http://localhost:5000`

---

## 📁 Project Structure

```text
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components (QRDisplay, etc.)
│   │   ├── pages/          # Page layouts (QueueManager, PublicDisplay, etc.)
│   │   ├── App.jsx         # Client routing and entrypoint
│   │   └── main.jsx
├── server/                 # Backend Node.js express application
│   ├── models/             # Mongoose schemas (Doctor, Shift, Patient)
│   ├── routes/             # Express API endpoints
│   ├── socket/             # WebSocket handlers for real-time updates
│   └── index.js            # Express server configuration
├── package.json            # Root workspaces and concurrently script
└── README.md               # Project documentation
```

---

## 🖥️ Screen & Workspace User Guide

### 1. 📺 Live Public Department Board (Public Screen)
* **Access Route**: `/` (Default Landing Page)
* **Target Audience**: Patients waiting in the main clinic lobby/lounge.
* **Key Visuals & Functions**:
  - Displays a grid view of all active **Doctor Chambers** (e.g. Dr. Shanmugam - Room 101).
  - Highlights the **Now Hosting** token number for each doctor, which flashes in green during updates.
  - Lists the next **5 waiting patients** in the sequence, along with their live estimated wait times.
  - Automatically handles real-time WebSocket events to immediately shift sequence tokens when patients are called or skipped.
  - Fits beautifully on a lobby TV or wall monitor.

### 2. 🎛️ Receptionist Control Panel (Receptionist Screen)
* **Access Route**: `/login` (Shift start) and `/dashboard` (Workspace control panel)
* **Target Audience**: Receptionists and front-desk clinic coordinators.
* **Key Visuals & Functions**:
  - **Doctor Selector**: Change active doctor view to assign tickets and check specific room loads.
  - **Add Patient Form**: Capture full names, toggle **Priority Token** status (which places emergencies and senior citizens at the top of the queue), and optionally add a WhatsApp number.
  - **Scan-to-Share QR Code**: Automatically displays the unique room QR code. Receptionists can let walk-in patients scan the screen directly to open their mobile status page, or click the link to print/open it.
  - **Currently Serving Panel**: Controls to "Call Next Patient" (which sounds/flashes the token), "Skip" (places patient on hold), and "Done" (completes consultation).
  - **5-Second Undo**: If the receptionist mistakenly clicks an action, a toast notification with a countdown allows them to click "Undo" to reverse it instantly.

### 3. 📱 Patient Live Updates Page (Patient Room QR Screen)
* **Access Route**: `/queue/:doctorId` (Scanned via Room QR Code)
* **Target Audience**: Individual patients waiting outside the room or resting nearby.
* **Key Visuals & Functions**:
  - **Select Token Tracking**: A dropdown menu allows the patient to select their assigned token number.
  - **Personalized Wait Details**: Once selected, the page dynamically displays their exact queue position (e.g., "3 patients ahead") and a customized countdown wait badge in minutes.
  - **Interactive Queue Sequence**: A visual progress bar showing standard/priority patient status tags in the sequence order.
  - **Notify Me Button**: Allows patients to register for instant status updates.

