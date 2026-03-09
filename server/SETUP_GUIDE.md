# Quick Setup Guide - Census Form Validation

## What Was Created

Three new files have been added to your project:

1. **validation_sprocs.sql** - Contains 8 stored procedures for form validation
2. **VALIDATION_PROCEDURES_README.md** - Comprehensive documentation
3. **routes.js** (Updated) - Uses stored procedures instead of direct insert

## Installation Steps

### Step 1: Create the Stored Procedures

Open your MySQL client (phpMyAdmin, MySQL Workbench, or Command Line) and execute the contents of:
```
server/validation_sprocs.sql
```

**Alternative - Command Line (Windows PowerShell):**
```powershell
cd c:\Users\SreenathSomashekar\AngularPRJ\census-app\server
mysql -u root --password=admin censusdb < validation_sprocs.sql
```

**Alternative - Command Line (Windows CMD):**
```cmd
cd c:\Users\SreenathSomashekar\AngularPRJ\census-app\server
mysql -u root -p admin censusdb < validation_sprocs.sql
```

**Alternative - Full path (PowerShell):**
```powershell
mysql -u root --password=admin censusdb < "c:\Users\SreenathSomashekar\AngularPRJ\census-app\server\validation_sprocs.sql"
```

### Step 2: Verify Installation

Run this command to verify all procedures were created:
```sql
SHOW PROCEDURE STATUS WHERE db = 'censusdb';
```

You should see 8 procedures listed:
- ValidateFirstName
- ValidateLastName
- ValidateSSN
- ValidateEmailId
- ValidateEid
- ValidateAndInsertCensus
- ValidateEmailUniqueness
- ValidateSSNUniqueness

### Step 3: Update Database Table (if needed)

Add UNIQUE constraints to prevent duplicates:
```sql
ALTER TABLE CensusDetails ADD UNIQUE KEY unique_ssn (SSN);
ALTER TABLE CensusDetails ADD UNIQUE KEY unique_email (EmailId);
ALTER TABLE CensusDetails ADD UNIQUE KEY unique_eid (Eid);
```

## What Changed in routes.js

**Before:**
```javascript
await connection.query(
    `INSERT INTO CensusDetails (FirstName, LastName, SSN, EmailId, Eid)
     VALUES (?, ?, ?, ?, ?)`,
    [FirstName, LastName, SSN, EmailId, Eid]
);
```

**After:**
```javascript
const [results] = await connection.query(
    `CALL ValidateAndInsertCensus(?, ?, ?, ?, ?, @p_Success, @p_Message, @p_InsertedId)`,
    [FirstName, LastName, SSN, EmailId, Eid]
);
const [outputParams] = await connection.query('SELECT @p_Success as Success, @p_Message as Message, @p_InsertedId as InsertedId');
```

## Form Validation Rules

### FirstName & LastName
- ✓ Required
- ✓ 2-100 characters
- ✓ Letters, spaces, hyphens, apostrophes only

### SSN (Social Security Number)
- ✓ Required
- ✓ Format: XXX-XX-XXXX
- ✓ Cannot start with 000, 666, or 9
- ✓ Middle section cannot be 00
- ✓ Last section cannot be 0000

### EmailId
- ✓ Required
- ✓ Valid email format
- ✓ Maximum 255 characters
- ✓ Must be unique in database

### Eid (Employee ID)
- ✓ Required
- ✓ Numeric only
- ✓ Maximum 20 characters
- ✓ Must be unique in database

## Response Format

**Success Response:**
```json
{
    "success": true,
    "message": "Census record added successfully",
    "id": 1
}
```

**Validation Error Response:**
```json
{
    "success": false,
    "message": "SSN must be in format XXX-XX-XXXX"
}
```

**Database Error Response:**
```json
{
    "success": false,
    "message": "Error message details"
}
```

## Testing the Setup

### Using cURL:
```bash
curl -X POST http://localhost:3000/api/addCensus \
  -H "Content-Type: application/json" \
  -d '{
    "FirstName": "John",
    "LastName": "Doe",
    "SSN": "123-45-6789",
    "EmailId": "john@example.com",
    "Eid": "12345"
  }'
```

### Using Postman:
1. Create a new POST request to `http://localhost:3000/api/addCensus`
2. Set Content-Type to application/json
3. Add the JSON payload in the body
4. Click Send

### Using Angular (app.js):
The Angular service is already compatible and will handle the new response format automatically.

## Troubleshooting

**Issue: "Procedure not found"**
- Solution: Make sure you executed the SQL file and procedures were created successfully

**Issue: "Eid already exists"**
- Solution: The Eid must be unique. Try a different Eid value

**Issue: "SSN must be in format XXX-XX-XXXX"**
- Solution: Ensure SSN follows the correct format with hyphens (e.g., 123-45-6789)

**Issue: "EmailId must be a valid email address"**
- Solution: Ensure email contains @ and valid domain (e.g., user@example.com)

## Files Structure After Setup

```
census-app/
├── client/
│   ├── app.js
│   └── index.html
└── server/
    ├── db.js
    ├── server.js
    ├── routes.js (UPDATED)
    ├── package.json
    ├── validation_sprocs.sql (NEW)
    └── VALIDATION_PROCEDURES_README.md (NEW)
```

## Next Steps

1. ✓ Create stored procedures (validation_sprocs.sql)
2. ✓ Update routes.js to use procedures
3. ✓ Test with sample data
4. Consider adding client-side validation in app.js
5. Review VALIDATION_PROCEDURES_README.md for detailed documentation

## Support

For detailed information about each stored procedure, validation rules, and usage examples, refer to:
`server/VALIDATION_PROCEDURES_README.md`
