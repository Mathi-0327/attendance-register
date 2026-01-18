# CHAPTER 4: SYSTEM DESIGN

## 4.1 System Architecture

### 4.1.1 Overall Architecture

The Attendance Register System follows a **three-tier client-server architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Admin      │  │   Student    │  │   Student    │  │
│  │  Dashboard   │  │   Access     │  │   Portal     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         React.js Frontend (TypeScript)                   │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION TIER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   REST API   │  │  WebSocket   │  │   Security   │  │
│  │   Endpoints  │  │    Server    │  │  Middleware  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         Express.js Backend (Node.js)                     │
└─────────────────────────────────────────────────────────┘
                          ↕ SQL Queries
┌─────────────────────────────────────────────────────────┐
│                      DATA TIER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Students   │  │  Attendance  │  │   Sessions   │  │
│  │    Table     │  │    Records   │  │    Table     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│              SQLite Database (Drizzle ORM)               │
└─────────────────────────────────────────────────────────┘
```

### 4.1.2 Component Diagram

**Frontend Components:**
```
App
├── Router
│   ├── HomePage
│   ├── AdminDashboard
│   │   ├── StatsCards
│   │   ├── LiveFeed
│   │   ├── QRCodeDisplay
│   │   ├── SearchAndFilter
│   │   └── SessionHistory
│   ├── StudentAccess
│   │   └── AttendanceForm
│   └── StudentPortal
│       ├── Dashboard
│       ├── AttendanceHistory
│       └── ProfileSettings
└── SystemContext (State Management)
```

**Backend Components:**
```
Server
├── Routes
│   ├── Authentication Routes
│   ├── Session Routes
│   ├── Attendance Routes
│   ├── Student Routes
│   └── Admin Routes
├── Middleware
│   ├── IP Validation
│   ├── Rate Limiting
│   ├── Error Handling
│   └── CORS
├── WebSocket Server
│   └── Event Handlers
└── Database Layer
    ├── Storage Interface
    └── Drizzle ORM
```

### 4.1.3 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Local Network (LAN)                 │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  Client 1  │  │  Client 2  │  │  Client N  │   │
│  │  (Browser) │  │  (Browser) │  │  (Browser) │   │
│  └────────────┘  └────────────┘  └────────────┘   │
│         │               │               │          │
│         └───────────────┼───────────────┘          │
│                         │                          │
│                  ┌──────▼──────┐                   │
│                  │   Router    │                   │
│                  └──────┬──────┘                   │
│                         │                          │
│                  ┌──────▼──────┐                   │
│                  │   Server    │                   │
│                  │  (Node.js)  │                   │
│                  │             │                   │
│                  │  ┌───────┐  │                   │
│                  │  │SQLite │  │                   │
│                  │  │  DB   │  │                   │
│                  │  └───────┘  │                   │
│                  └─────────────┘                   │
└─────────────────────────────────────────────────────┘
```

---

## 4.2 Database Design

### 4.2.1 Entity-Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   USERS     │         │   SESSIONS   │         │  STUDENTS   │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id (PK)     │         │ id (PK)      │         │ id (PK)     │
│ username    │         │ name         │         │ studentId   │
│ password    │         │ startTime    │         │ name        │
│ role        │         │ endTime      │         │ department  │
│ createdAt   │         │ isActive     │         │ password    │
└─────────────┘         └──────────────┘         │ email       │
                               │                 │ phone       │
                               │                 │ year        │
                               │                 │ createdAt   │
                               │                 └─────────────┘
                               │
                        ┌──────▼───────────┐
                        │ ATTENDANCE_      │
                        │    RECORDS       │
                        ├──────────────────┤
                        │ id (PK)          │
                        │ sessionId (FK)   │
                        │ name             │
                        │ studentId        │
                        │ department       │
                        │ ipAddress        │
                        │ device           │
                        │ timestamp        │
                        │ status           │
                        └──────────────────┘
```

### 4.2.2 Database Schema

**Table: users**
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
```

**Table: students**
```sql
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    year TEXT,
    created_at INTEGER NOT NULL
);
```

**Table: sessions**
```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1
);
```

**Table: attendance_records**
```sql
CREATE TABLE attendance_records (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id),
    name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    department TEXT,
    ip_address TEXT NOT NULL,
    device TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT NOT NULL
);
```

### 4.2.3 Database Normalization

The database follows **Third Normal Form (3NF)**:

**1NF (First Normal Form):**
- All tables have primary keys
- All columns contain atomic values
- No repeating groups

**2NF (Second Normal Form):**
- Meets 1NF requirements
- All non-key attributes fully depend on primary key
- No partial dependencies

**3NF (Third Normal Form):**
- Meets 2NF requirements
- No transitive dependencies
- All attributes depend only on primary key

### 4.2.4 Indexes

**Performance Optimization Indexes:**
```sql
-- Index on student_id for quick lookup
CREATE INDEX idx_students_student_id ON students(student_id);

-- Index on session_id for attendance queries
CREATE INDEX idx_attendance_session ON attendance_records(session_id);

-- Index on timestamp for date-based queries
CREATE INDEX idx_attendance_timestamp ON attendance_records(timestamp);

-- Index on student_id in attendance for personal history
CREATE INDEX idx_attendance_student ON attendance_records(student_id);

-- Index on session active status
CREATE INDEX idx_sessions_active ON sessions(is_active);
```

---

## 4.3 Module Design

### 4.3.1 Frontend Modules

**Module 1: Authentication Module**
- **Purpose**: Handle user login/logout
- **Components**: LoginForm, AuthContext
- **Functions**:
  - `login(credentials)`: Authenticate user
  - `logout()`: Clear session
  - `checkAuth()`: Verify authentication status

**Module 2: Session Management Module**
- **Purpose**: Manage attendance sessions
- **Components**: SessionControl, SessionDialog
- **Functions**:
  - `startSession(name, threshold)`: Create new session
  - `stopSession()`: End current session
  - `getSessionStatus()`: Check if session active

**Module 3: Attendance Module**
- **Purpose**: Handle attendance submission
- **Components**: AttendanceForm, ConfirmationDialog
- **Functions**:
  - `submitAttendance(data)`: Submit attendance record
  - `validateInput(data)`: Validate form data
  - `checkDuplicate(studentId)`: Prevent duplicates

**Module 4: Real-Time Communication Module**
- **Purpose**: WebSocket connection management
- **Components**: WebSocketProvider
- **Functions**:
  - `connect()`: Establish WebSocket connection
  - `disconnect()`: Close connection
  - `subscribe(event, callback)`: Listen to events
  - `broadcast(event, data)`: Send data to server

**Module 5: Reporting Module**
- **Purpose**: Generate and export reports
- **Components**: ExportButtons, ReportGenerator
- **Functions**:
  - `exportCSV(data)`: Generate CSV file
  - `exportExcel(data)`: Generate Excel file
  - `exportPDF(data)`: Generate PDF file
  - `exportSlides(data)`: Generate Google Slides

### 4.3.2 Backend Modules

**Module 1: API Routes Module**
- **Purpose**: Define REST API endpoints
- **File**: `routes.ts`
- **Endpoints**:
  - POST `/api/session/toggle`: Start/stop session
  - POST `/api/attendance`: Submit attendance
  - GET `/api/attendance`: Get all records
  - GET `/api/students/:id`: Get student info
  - POST `/api/students/register`: Register student
  - POST `/api/students/login`: Student login

**Module 2: Storage Module**
- **Purpose**: Database operations
- **File**: `storage.ts`
- **Functions**:
  - `createAttendanceRecord(data)`: Insert record
  - `getAllAttendanceRecords()`: Fetch all records
  - `getAttendanceRecordsByStudentId(id)`: Get student records
  - `createSession(name)`: Create new session
  - `endSession()`: Close active session
  - `getAllSessions()`: Get session history

**Module 3: Security Module**
- **Purpose**: Authentication and validation
- **File**: `security.ts`
- **Functions**:
  - `hashPassword(password)`: Hash passwords
  - `validatePassword(input, hash)`: Verify password
  - `rateLimit()`: Limit request rate
  - `validateIP(ip)`: Check network access

**Module 4: WebSocket Module**
- **Purpose**: Real-time communication
- **File**: `websocket.ts`
- **Functions**:
  - `setupWebSocket(server)`: Initialize WebSocket
  - `notifyAttendanceRecorded(record)`: Broadcast new record
  - `notifySessionToggled(status)`: Broadcast session change
  - `notifyRecordsCleared()`: Broadcast data clear

---

## 4.4 User Interface Design

### 4.4.1 Design Principles

**1. Simplicity**
- Minimal clicks to complete tasks
- Clear visual hierarchy
- Uncluttered layouts

**2. Consistency**
- Uniform color scheme
- Consistent button styles
- Standard navigation patterns

**3. Responsiveness**
- Mobile-first design
- Adaptive layouts
- Touch-friendly controls

**4. Feedback**
- Immediate visual feedback
- Clear success/error messages
- Loading indicators

**5. Accessibility**
- High contrast ratios
- Keyboard navigation
- Screen reader support

### 4.4.2 Color Scheme

**Primary Colors:**
- Primary: `hsl(222.2, 47.4%, 11.2%)` - Dark blue
- Secondary: `hsl(210, 40%, 96.1%)` - Light gray
- Accent: `hsl(217.2, 91.2%, 59.8%)` - Blue

**Semantic Colors:**
- Success: `hsl(142, 76%, 36%)` - Green
- Warning: `hsl(38, 92%, 50%)` - Orange
- Error: `hsl(0, 84%, 60%)` - Red
- Info: `hsl(199, 89%, 48%)` - Cyan

### 4.4.3 Typography

**Font Family:**
- Primary: Inter, system-ui, sans-serif
- Monospace: 'Courier New', monospace

**Font Sizes:**
- Heading 1: 2.25rem (36px)
- Heading 2: 1.875rem (30px)
- Heading 3: 1.5rem (24px)
- Body: 1rem (16px)
- Small: 0.875rem (14px)

### 4.4.4 Wireframes

**Homepage Layout:**
```
┌────────────────────────────────────────────┐
│            Header (Logo + Nav)             │
├────────────────────────────────────────────┤
│                                            │
│         AttendReg - Attendance System      │
│                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Student  │  │ Student  │  │  Host    ││
│  │ Access   │  │ Portal   │  │Dashboard ││
│  │          │  │          │  │          ││
│  │  [Icon]  │  │  [Icon]  │  │  [Icon]  ││
│  │          │  │          │  │          ││
│  │ [Button] │  │ [Button] │  │ [Button] ││
│  └──────────┘  └──────────┘  └──────────┘│
│                                            │
└────────────────────────────────────────────┘
```

**Admin Dashboard Layout:**
```
┌────────────────────────────────────────────┐
│  Header (Logo + Tabs + Session + Logout)  │
├────────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐          │
│  │Total│  │On  │  │Late│  │Rate│          │
│  │ 45 │  │ 40 │  │ 5  │  │89% │          │
│  └────┘  └────┘  └────┘  └────┘          │
├──────────────────────────┬─────────────────┤
│  Live Attendance Feed    │   QR Code      │
│  ┌────────────────────┐  │  ┌──────────┐ │
│  │ Time | Name | Dept │  │  │ [QR IMG] │ │
│  │ 2:30 | John | CS   │  │  └──────────┘ │
│  │ 2:31 | Jane | IT   │  │                │
│  │ 2:32 | Bob  | ECE  │  │  Export        │
│  │ ...               │  │  [CSV] [PDF]   │
│  └────────────────────┘  │  [Excel]       │
│                          │                │
│  Chart: Dept Breakdown   │  Clear Data    │
│  ┌────────────────────┐  │  [Button]      │
│  │    [Bar Chart]     │  │                │
│  └────────────────────┘  │                │
└──────────────────────────┴─────────────────┘
```

**Student Access Layout:**
```
┌────────────────────────────────────────────┐
│            Header (Logo + Nav)             │
├────────────────────────────────────────────┤
│                                            │
│         Mark Your Attendance               │
│                                            │
│  ┌──────────────────────────────────────┐ │
│  │  Full Name:                          │ │
│  │  [_____________________________]     │ │
│  │                                      │ │
│  │  Student ID:                         │ │
│  │  [_____________________________]     │ │
│  │                                      │ │
│  │  Department:                         │ │
│  │  [Dropdown ▼]                        │ │
│  │                                      │ │
│  │         [Submit Attendance]          │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Session Status: ● Active                  │
│                                            │
└────────────────────────────────────────────┘
```

---

## 4.5 Security Design

### 4.5.1 Authentication Flow

```
User Login Attempt
      │
      ▼
 Input Validation
      │
      ▼
 Hash Password (SHA-256)
      │
      ▼
 Compare with Stored Hash
      │
      ├─── Match ────► Create Session ──► Grant Access
      │
      └─── No Match ─► Increment Attempts ──► Show Error
                              │
                              ▼
                       Max Attempts? ──► Lock Account
```

### 4.5.2 Attendance Submission Security

```
Attendance Submission
      │
      ▼
 Network Validation (Same LAN?)
      │
      ├─── No ────► Reject (403)
      │
      ▼
 Session Active?
      │
      ├─── No ────► Reject (403)
      │
      ▼
 Input Validation
      │
      ├─── Invalid ──► Reject (400)
      │
      ▼
 Duplicate Check (Same Student + Session?)
      │
      ├─── Yes ───► Reject (409)
      │
      ▼
 Rate Limit Check (IP < 10 per session?)
      │
      ├─── No ────► Reject (429)
      │
      ▼
 Device Claiming (First device?)
      │
      ├─── Different Device ──► Reject (403)
      │
      ▼
 Record Attendance ──► Success (201)
```

### 4.5.3 Security Layers

**Layer 1: Network Level**
- IP address validation
- Same network requirement
- Firewall rules

**Layer 2: Application Level**
- Password hashing (SHA-256)
- Session management
- Rate limiting
- Input validation
- CORS policies

**Layer 3: Database Level**
- Parameterized queries (SQL injection prevention)
- Data validation
- Constraints and foreign keys

**Layer 4: Business Logic Level**
- Duplicate prevention
- Device claiming
- Session state validation

---

## 4.6 Data Flow Diagrams

### 4.6.1 Level 0 DFD (Context Diagram)

```
┌──────────┐                              ┌──────────┐
│          │    Attendance Submission     │          │
│ Student  ├─────────────────────────────►│          │
│          │◄─────────────────────────────┤          │
│          │    Confirmation              │          │
└──────────┘                              │          │
                                          │ Attendance│
┌──────────┐                              │  Register │
│          │    Session Management        │  System   │
│  Admin   ├─────────────────────────────►│          │
│          │◄─────────────────────────────┤          │
│          │    Reports & Statistics      │          │
└──────────┘                              └──────────┘
```

### 4.6.2 Level 1 DFD

```
                    ┌─────────────┐
                    │  Students   │
                    └──────┬──────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ 1.0 Mark Attendance    │
              └────────┬───────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ D1: Attendance │
              │    Records     │
              └────────┬───────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌────────────┐  ┌─────────────┐  ┌──────────────┐
│ 2.0 View   │  │ 3.0 Manage  │  │ 4.0 Generate │
│ Real-time  │  │ Sessions    │  │ Reports      │
│ Feed       │  │             │  │              │
└────────────┘  └─────────────┘  └──────────────┘
         │             │             │
         └─────────────┼─────────────┘
                       │
                       ▼
                  ┌─────────┐
                  │  Admin  │
                  └─────────┘
```

---

## 4.7 Use Case Diagrams

### 4.7.1 Admin Use Cases

```
                    ┌─────────────────────┐
                    │       Admin         │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
    ┌────────┐          ┌──────────┐         ┌──────────┐
    │ Login  │          │  Start   │         │   View   │
    │        │          │ Session  │         │  Reports │
    └────────┘          └──────────┘         └──────────┘
                               │
                               ▼
                        ┌──────────┐
                        │   Stop   │
                        │ Session  │
                        └──────────┘
                               │
                               ▼
                        ┌──────────┐
                        │  Export  │
                        │   Data   │
                        └──────────┘
```

### 4.7.2 Student Use Cases

```
                    ┌─────────────────────┐
                    │      Student        │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
    ┌────────┐          ┌──────────┐         ┌──────────┐
    │Register│          │   Mark   │         │   View   │
    │        │          │Attendance│         │ History  │
    └────────┘          └──────────┘         └──────────┘
         │                                           │
         ▼                                           ▼
    ┌────────┐                                ┌──────────┐
    │ Login  │                                │   View   │
    │        │                                │  Streak  │
    └────────┘                                └──────────┘
```

---

## 4.8 Sequence Diagrams

### 4.8.1 Attendance Submission Sequence

```
Student    Browser    Server    Database    WebSocket
  │          │          │          │            │
  │ Fill Form│          │          │            │
  ├─────────►│          │          │            │
  │          │ Submit   │          │            │
  │          ├─────────►│          │            │
  │          │          │ Validate │            │
  │          │          ├─────────►│            │
  │          │          │◄─────────┤            │
  │          │          │ Insert   │            │
  │          │          ├─────────►│            │
  │          │          │◄─────────┤            │
  │          │          │ Broadcast│            │
  │          │          ├──────────┼───────────►│
  │          │◄─────────┤          │            │
  │◄─────────┤          │          │            │
  │ Success  │          │          │            │
```

### 4.8.2 Session Management Sequence

```
Admin    Browser    Server    Database    WebSocket
  │        │          │          │            │
  │ Toggle │          │          │            │
  ├───────►│          │          │            │
  │        │ Request  │          │            │
  │        ├─────────►│          │            │
  │        │          │ Create   │            │
  │        │          │ Session  │            │
  │        │          ├─────────►│            │
  │        │          │◄─────────┤            │
  │        │          │ Notify   │            │
  │        │          ├──────────┼───────────►│
  │        │◄─────────┤          │            │
  │◄───────┤          │          │            │
  │ Active │          │          │            │
```

---

**Page Count: 10 pages (Total: 40 pages)**
