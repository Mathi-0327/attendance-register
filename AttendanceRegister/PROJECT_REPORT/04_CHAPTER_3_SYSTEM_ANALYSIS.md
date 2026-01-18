# CHAPTER 3: SYSTEM ANALYSIS

## 3.1 Requirement Analysis

### 3.1.1 User Requirements

**Administrator/Faculty Requirements:**
1. Ability to start and stop attendance sessions
2. Real-time monitoring of attendance submissions
3. View comprehensive attendance statistics
4. Export attendance data in multiple formats
5. Manage student accounts
6. Search and filter attendance records
7. View session history
8. Generate QR codes for quick access
9. Bulk operations on attendance records
10. Secure authentication

**Student Requirements:**
1. Easy attendance submission process
2. Immediate confirmation of attendance
3. View personal attendance history
4. Track attendance streaks and statistics
5. Access from mobile devices
6. Register and manage account
7. View attendance percentage
8. No complex setup or installation

**System Administrator Requirements:**
1. Easy deployment and setup
2. Minimal hardware requirements
3. Database management capabilities
4. System monitoring tools
5. Backup and restore functionality

### 3.1.2 System Requirements

**Functional Requirements:**
1. User authentication and authorization
2. Session management (create, start, stop, view)
3. Attendance recording with validation
4. Real-time data synchronization
5. Data persistence and retrieval
6. Report generation and export
7. Search and filter capabilities
8. QR code generation
9. Gamification features (streaks)
10. Network validation

**Non-Functional Requirements:**
1. **Performance**: Response time < 1 second
2. **Scalability**: Support 500+ concurrent users
3. **Reliability**: 99.9% uptime
4. **Security**: Multi-layer validation
5. **Usability**: Intuitive interface, minimal training
6. **Maintainability**: Clean, documented code
7. **Portability**: Cross-platform compatibility
8. **Availability**: 24/7 operation capability

---

## 3.2 Feasibility Study

### 3.2.1 Technical Feasibility

**Technology Availability:**
- ✅ React.js: Mature, well-documented frontend framework
- ✅ Express.js: Proven backend framework
- ✅ SQLite: Reliable embedded database
- ✅ WebSocket: Standard protocol with wide support
- ✅ TypeScript: Industry-standard type system

**Development Expertise:**
- ✅ Web development skills available
- ✅ Database management knowledge present
- ✅ Real-time systems understanding acquired
- ✅ Security best practices known

**Infrastructure:**
- ✅ Development environment setup possible
- ✅ Testing infrastructure available
- ✅ Deployment environment accessible

**Conclusion:** Technically feasible with available resources and expertise.

### 3.2.2 Economic Feasibility

**Development Costs:**
| Item | Cost |
|------|------|
| Development Tools (Free/Open Source) | $0 |
| Testing Environment | $0 |
| Documentation Tools | $0 |
| **Total Development Cost** | **$0** |

**Deployment Costs:**
| Item | Cost (One-time) | Cost (Annual) |
|------|-----------------|---------------|
| Server Hardware (existing) | $0 | $0 |
| Software Licenses (Open Source) | $0 | $0 |
| Domain/Hosting (Local network) | $0 | $0 |
| Maintenance | $0 | $500 |
| **Total** | **$0** | **$500** |

**Cost Comparison with Alternatives:**
| Solution | Initial Cost | Annual Cost |
|----------|--------------|-------------|
| Biometric System | $10,000 | $1,000 |
| RFID System | $5,000 | $800 |
| Commercial Software | $3,000 | $1,200 |
| **Our System** | **$0** | **$500** |

**Return on Investment:**
- Time saved: 10 hours/week = 520 hours/year
- At $20/hour: $10,400/year saved
- ROI: Infinite (zero initial investment)

**Conclusion:** Economically highly feasible with minimal costs and significant savings.

### 3.2.3 Operational Feasibility

**User Acceptance:**
- Simple, intuitive interface
- Minimal training required
- Familiar web-based interaction
- Mobile-friendly design

**Integration with Existing Processes:**
- Replaces manual attendance seamlessly
- Export capabilities for existing systems
- No disruption to current workflows

**Resource Availability:**
- Network infrastructure already present
- Devices (computers/phones) already available
- No additional hardware needed

**Conclusion:** Operationally feasible with high user acceptance probability.

### 3.2.4 Schedule Feasibility

**Project Timeline:**
| Phase | Duration | Tasks |
|-------|----------|-------|
| Planning & Analysis | 2 weeks | Requirements, design |
| Database Design | 1 week | Schema, relationships |
| Backend Development | 3 weeks | API, WebSocket, security |
| Frontend Development | 4 weeks | UI components, integration |
| Testing | 2 weeks | Unit, integration, system |
| Documentation | 1 week | User manual, technical docs |
| Deployment | 1 week | Setup, configuration |
| **Total** | **14 weeks** | |

**Conclusion:** Schedule is realistic and achievable within academic timeline.

---

## 3.3 Hardware Requirements

### 3.3.1 Server Requirements

**Minimum Configuration:**
- **Processor**: Intel Core i3 or equivalent (2.0 GHz)
- **RAM**: 4 GB
- **Storage**: 20 GB available space
- **Network**: Ethernet port (100 Mbps)
- **Operating System**: Windows 10/Linux Ubuntu 18.04 or higher

**Recommended Configuration:**
- **Processor**: Intel Core i5 or equivalent (2.5 GHz)
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: Gigabit Ethernet
- **Operating System**: Windows Server 2019/Linux Ubuntu 22.04

### 3.3.2 Client Requirements

**Desktop/Laptop:**
- **Processor**: Any modern processor (1.5 GHz+)
- **RAM**: 2 GB minimum
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Network**: WiFi or Ethernet connection
- **Screen**: 1024x768 minimum resolution

**Mobile Devices:**
- **OS**: Android 8.0+ or iOS 12+
- **Browser**: Chrome Mobile, Safari Mobile
- **Network**: WiFi connection
- **Camera**: For QR code scanning (optional)

### 3.3.3 Network Requirements

**Infrastructure:**
- **Type**: Local Area Network (LAN)
- **Speed**: 10 Mbps minimum, 100 Mbps recommended
- **Topology**: Star or mesh
- **Devices**: Router, switches as needed
- **Coverage**: WiFi access points for mobile devices

**Bandwidth Calculation:**
- Per user: ~50 KB/s average
- For 500 users: 25 MB/s peak
- Recommended: 100 Mbps connection

---

## 3.4 Software Requirements

### 3.4.1 Development Environment

**Programming Languages:**
- TypeScript 5.0+
- JavaScript ES2022+
- HTML5
- CSS3

**Frontend Framework:**
- React.js 18.2+
- React Router 6.0+
- React Query 4.0+

**Backend Framework:**
- Node.js 18.0+
- Express.js 4.18+
- WebSocket (ws library)

**Database:**
- SQLite 3.40+
- Drizzle ORM 0.28+

**Build Tools:**
- Vite 4.0+
- TypeScript Compiler
- ESLint
- Prettier

**Development Tools:**
- Visual Studio Code
- Git for version control
- npm/yarn package manager
- Postman for API testing

### 3.4.2 Runtime Environment

**Server:**
- Node.js Runtime 18.0+
- SQLite database engine
- Operating System: Windows/Linux

**Client:**
- Modern web browser
- JavaScript enabled
- Cookies enabled
- WebSocket support

### 3.4.3 Third-Party Libraries

**Frontend:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "@tanstack/react-query": "^4.24.0",
  "date-fns": "^2.29.3",
  "recharts": "^2.5.0",
  "sonner": "^0.3.5",
  "framer-motion": "^10.0.0",
  "lucide-react": "^0.263.1",
  "qrcode.react": "^3.1.0",
  "xlsx": "^0.18.5",
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.5.31"
}
```

**Backend:**
```json
{
  "express": "^4.18.2",
  "ws": "^8.12.0",
  "better-sqlite3": "^8.1.0",
  "drizzle-orm": "^0.28.0",
  "cors": "^2.8.5",
  "helmet": "^7.0.0",
  "express-rate-limit": "^6.7.0"
}
```

---

## 3.5 Functional Requirements

### 3.5.1 User Management

**FR-1.1: Admin Authentication**
- **Description**: System shall provide secure login for administrators
- **Input**: Username/Password
- **Process**: Validate credentials, create session
- **Output**: Authentication token, dashboard access
- **Priority**: High

**FR-1.2: Student Registration**
- **Description**: Students can create accounts
- **Input**: Student ID, Name, Department, Password
- **Process**: Validate input, hash password, store in database
- **Output**: Account created, auto-login
- **Priority**: High

**FR-1.3: Student Login**
- **Description**: Students can access their portal
- **Input**: Student ID, Password
- **Process**: Verify credentials, create session
- **Output**: Access to student dashboard
- **Priority**: High

### 3.5.2 Session Management

**FR-2.1: Create Session**
- **Description**: Admin can start attendance session
- **Input**: Session name (optional), late threshold
- **Process**: Create session record, activate session
- **Output**: Active session, QR code generated
- **Priority**: Critical

**FR-2.2: Stop Session**
- **Description**: Admin can end active session
- **Input**: Stop command
- **Process**: Mark session as inactive, record end time
- **Output**: Session closed, data saved
- **Priority**: Critical

**FR-2.3: View Session History**
- **Description**: View all past sessions
- **Input**: None (or filters)
- **Process**: Query database, format results
- **Output**: List of sessions with details
- **Priority**: Medium

### 3.5.3 Attendance Management

**FR-3.1: Mark Attendance**
- **Description**: Students submit attendance
- **Input**: Name, Student ID, Department
- **Process**: Validate session, check duplicates, record attendance
- **Output**: Confirmation message, timestamp
- **Priority**: Critical

**FR-3.2: Duplicate Prevention**
- **Description**: Prevent multiple submissions per session
- **Input**: Student ID, Session ID
- **Process**: Check existing records
- **Output**: Error if duplicate, success otherwise
- **Priority**: High

**FR-3.3: Network Validation**
- **Description**: Verify user is on same network
- **Input**: Client IP address
- **Process**: Compare with server network
- **Output**: Allow/deny access
- **Priority**: High

### 3.5.4 Real-Time Updates

**FR-4.1: Live Feed**
- **Description**: Display attendance submissions in real-time
- **Input**: New attendance record
- **Process**: Broadcast via WebSocket
- **Output**: Updated feed on all connected clients
- **Priority**: High

**FR-4.2: Statistics Update**
- **Description**: Update statistics automatically
- **Input**: Attendance data changes
- **Process**: Recalculate metrics
- **Output**: Updated dashboard statistics
- **Priority**: Medium

### 3.5.5 Reporting and Export

**FR-5.1: Export to CSV**
- **Description**: Download attendance data as CSV
- **Input**: Export command
- **Process**: Format data, generate file
- **Output**: CSV file download
- **Priority**: Medium

**FR-5.2: Export to Excel**
- **Description**: Generate Excel workbook
- **Input**: Export command
- **Process**: Create XLSX file with formatting
- **Output**: Excel file download
- **Priority**: Medium

**FR-5.3: Export to PDF**
- **Description**: Generate PDF report
- **Input**: Export command
- **Process**: Create formatted PDF
- **Output**: PDF file download
- **Priority**: Medium

**FR-5.4: Search and Filter**
- **Description**: Find specific records
- **Input**: Search query, filter criteria
- **Process**: Query database with filters
- **Output**: Filtered results
- **Priority**: Medium

### 3.5.6 Student Portal

**FR-6.1: View Personal History**
- **Description**: Students see their attendance records
- **Input**: Student ID (from session)
- **Process**: Query records for student
- **Output**: List of attendance entries
- **Priority**: Medium

**FR-6.2: Attendance Streak**
- **Description**: Track consecutive attendance days
- **Input**: Student attendance records
- **Process**: Calculate streak
- **Output**: Streak count, badge if applicable
- **Priority**: Low

**FR-6.3: Statistics Dashboard**
- **Description**: Show personal attendance metrics
- **Input**: Student records
- **Process**: Calculate percentages, totals
- **Output**: Dashboard with statistics
- **Priority**: Medium

---

## 3.6 Non-Functional Requirements

### 3.6.1 Performance Requirements

**NFR-1.1: Response Time**
- **Requirement**: System shall respond to user actions within 1 second
- **Measurement**: 95th percentile response time
- **Priority**: High

**NFR-1.2: Throughput**
- **Requirement**: Handle 100 concurrent attendance submissions
- **Measurement**: Successful transactions per second
- **Priority**: High

**NFR-1.3: Database Query Time**
- **Requirement**: Database queries complete within 100ms
- **Measurement**: Average query execution time
- **Priority**: Medium

### 3.6.2 Scalability Requirements

**NFR-2.1: User Capacity**
- **Requirement**: Support 500 concurrent users
- **Measurement**: Simultaneous active connections
- **Priority**: High

**NFR-2.2: Data Volume**
- **Requirement**: Handle 100,000 attendance records
- **Measurement**: Database size, query performance
- **Priority**: Medium

**NFR-2.3: Session Capacity**
- **Requirement**: Manage 1000+ historical sessions
- **Measurement**: Session retrieval time
- **Priority**: Low

### 3.6.3 Reliability Requirements

**NFR-3.1: Uptime**
- **Requirement**: 99.9% availability during operational hours
- **Measurement**: Uptime percentage
- **Priority**: High

**NFR-3.2: Data Integrity**
- **Requirement**: Zero data loss
- **Measurement**: Data verification checks
- **Priority**: Critical

**NFR-3.3: Error Recovery**
- **Requirement**: Graceful handling of errors
- **Measurement**: Error rate, recovery time
- **Priority**: High

### 3.6.4 Security Requirements

**NFR-4.1: Authentication**
- **Requirement**: Secure password-based authentication
- **Measurement**: Password hashing (SHA-256)
- **Priority**: Critical

**NFR-4.2: Authorization**
- **Requirement**: Role-based access control
- **Measurement**: Unauthorized access attempts blocked
- **Priority**: High

**NFR-4.3: Data Protection**
- **Requirement**: Encrypted password storage
- **Measurement**: No plain-text passwords
- **Priority**: Critical

**NFR-4.4: Network Security**
- **Requirement**: Same-network validation
- **Measurement**: External access blocked
- **Priority**: High

### 3.6.5 Usability Requirements

**NFR-5.1: Learning Curve**
- **Requirement**: Users can perform tasks without training
- **Measurement**: Task completion rate
- **Priority**: High

**NFR-5.2: Interface Consistency**
- **Requirement**: Consistent UI across all pages
- **Measurement**: Design system compliance
- **Priority**: Medium

**NFR-5.3: Accessibility**
- **Requirement**: Responsive design for all devices
- **Measurement**: Mobile compatibility score
- **Priority**: High

**NFR-5.4: Error Messages**
- **Requirement**: Clear, actionable error messages
- **Measurement**: User comprehension rate
- **Priority**: Medium

### 3.6.6 Maintainability Requirements

**NFR-6.1: Code Quality**
- **Requirement**: Clean, documented code
- **Measurement**: Code review scores
- **Priority**: Medium

**NFR-6.2: Modularity**
- **Requirement**: Component-based architecture
- **Measurement**: Module independence
- **Priority**: Medium

**NFR-6.3: Documentation**
- **Requirement**: Comprehensive technical documentation
- **Measurement**: Documentation coverage
- **Priority**: Medium

### 3.6.7 Portability Requirements

**NFR-7.1: Platform Independence**
- **Requirement**: Run on Windows and Linux
- **Measurement**: Cross-platform testing
- **Priority**: High

**NFR-7.2: Browser Compatibility**
- **Requirement**: Support major browsers
- **Measurement**: Chrome, Firefox, Safari, Edge compatibility
- **Priority**: High

**NFR-7.3: Database Portability**
- **Requirement**: SQLite file-based storage
- **Measurement**: Database file transferability
- **Priority**: Medium

---

## 3.7 Constraints

### 3.7.1 Technical Constraints

1. **Network Dependency**: System requires active network connection
2. **Browser Requirement**: Modern browser with JavaScript enabled
3. **Single Server**: No distributed architecture
4. **SQLite Limitations**: Single-writer constraint
5. **WebSocket Support**: Browser must support WebSocket protocol

### 3.7.2 Operational Constraints

1. **Manual Session Management**: Admin must manually start/stop sessions
2. **Same Network Requirement**: Users must be on same LAN
3. **No Offline Mode**: Requires server connectivity
4. **IP-based Limiting**: Maximum 10 submissions per IP per session

### 3.7.3 Business Constraints

1. **Single Institution**: Designed for one institution deployment
2. **No Multi-tenancy**: Cannot serve multiple organizations
3. **Local Deployment**: Not cloud-based
4. **Manual Backups**: No automated backup scheduling

---

**Page Count: 9 pages (Total: 30 pages)**
