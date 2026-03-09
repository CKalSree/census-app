# Census Form Validation - Stored Procedures Documentation

## Overview
This document describes the stored procedures created for validating census form data before insertion into the database.

## Stored Procedures

### 1. ValidateFirstName(p_FirstName, p_IsValid, p_ErrorMessage)
Validates the FirstName field with the following rules:
- **Required**: Cannot be empty or NULL
- **Length**: Minimum 2 characters, Maximum 100 characters
- **Characters**: Only letters (a-z, A-Z), spaces, hyphens, and apostrophes allowed

**Usage:**
```sql
CALL ValidateFirstName('John', @isValid, @errorMsg);
SELECT @isValid, @errorMsg;
```

---

### 2. ValidateLastName(p_LastName, p_IsValid, p_ErrorMessage)
Validates the LastName field with the following rules:
- **Required**: Cannot be empty or NULL
- **Length**: Minimum 2 characters, Maximum 100 characters
- **Characters**: Only letters (a-z, A-Z), spaces, hyphens, and apostrophes allowed

**Usage:**
```sql
CALL ValidateLastName('Doe', @isValid, @errorMsg);
SELECT @isValid, @errorMsg;
```

---

### 3. ValidateSSN(p_SSN, p_IsValid, p_ErrorMessage)
Validates the Social Security Number (SSN) field with comprehensive validation:
- **Required**: Cannot be empty or NULL
- **Format**: Must match XXX-XX-XXXX (e.g., 123-45-6789)
- **Invalid Values**:
  - Cannot start with 000
  - Cannot start with 666
  - Cannot start with 9
  - Middle section cannot be 00
  - Last section cannot be 0000

**Usage:**
```sql
CALL ValidateSSN('123-45-6789', @isValid, @errorMsg);
SELECT @isValid, @errorMsg;
```

---

### 4. ValidateEmailId(p_EmailId, p_IsValid, p_ErrorMessage)
Validates the Email ID field:
- **Required**: Cannot be empty or NULL
- **Length**: Maximum 255 characters
- **Format**: Must be a valid email format (e.g., user@example.com)
- **Validation**: Uses regex pattern for strict email validation

**Usage:**
```sql
CALL ValidateEmailId('user@example.com', @isValid, @errorMsg);
SELECT @isValid, @errorMsg;
```

---

### 5. ValidateEid(p_Eid, p_IsValid, p_ErrorMessage)
Validates the Employee ID (Eid) field:
- **Required**: Cannot be empty or NULL
- **Format**: Must contain only numeric characters
- **Length**: Maximum 20 characters
- **Uniqueness**: Eid must not already exist in the database

**Usage:**
```sql
CALL ValidateEid('12345', @isValid, @errorMsg);
SELECT @isValid, @errorMsg;
```

---

### 6. ValidateAndInsertCensus(p_FirstName, p_LastName, p_SSN, p_EmailId, p_Eid, p_Success, p_Message, p_InsertedId)
Comprehensive procedure that validates all fields and inserts the record if all validations pass.

**Input Parameters:**
- `p_FirstName`: First name to validate
- `p_LastName`: Last name to validate
- `p_SSN`: Social security number to validate
- `p_EmailId`: Email ID to validate
- `p_Eid`: Employee ID to validate

**Output Parameters:**
- `p_Success`: TRUE if insertion succeeded, FALSE otherwise
- `p_Message`: Descriptive message about validation or insertion result
- `p_InsertedId`: ID of the newly inserted record (NULL if insertion failed)

**Features:**
- Validates all five fields in order
- Returns the first validation error encountered
- Only inserts if all validations pass
- Trims whitespace from name and email fields
- Converts email to lowercase for consistency
- Handles database errors gracefully

**Usage:**
```sql
CALL ValidateAndInsertCensus('John', 'Doe', '123-45-6789', 'john@example.com', '12345', 
                              @success, @message, @insertedId);
SELECT @success, @message, @insertedId;
```

---

### 7. ValidateEmailUniqueness(p_EmailId, p_IsUnique, p_ErrorMessage)
Validates that an email address is not already registered in the system.
- **Uniqueness**: Checks if email already exists (case-insensitive)
- **Use Case**: Can be called before insertion to check email availability

**Usage:**
```sql
CALL ValidateEmailUniqueness('user@example.com', @isUnique, @errorMsg);
SELECT @isUnique, @errorMsg;
```

---

### 8. ValidateSSNUniqueness(p_SSN, p_IsUnique, p_ErrorMessage)
Validates that an SSN is not already registered in the system.
- **Uniqueness**: Checks if SSN already exists
- **Use Case**: Can be called before insertion to check SSN availability

**Usage:**
```sql
CALL ValidateSSNUniqueness('123-45-6789', @isUnique, @errorMsg);
SELECT @isUnique, @errorMsg;
```

---

## Implementation Steps

### 1. Execute the SQL Script
Run the `validation_sprocs.sql` file on your MySQL database:
```bash
mysql -u root -p censusdb < validation_sprocs.sql
```

Or execute the contents in your MySQL client (e.g., phpMyAdmin, MySQL Workbench).

### 2. Verify Stored Procedures
Check if all procedures are created:
```sql
SHOW PROCEDURE STATUS WHERE db = 'censusdb';
```

### 3. Update Application Code
The Node.js routes have been updated to use the `ValidateAndInsertCensus` procedure. 

The `/api/addCensus` endpoint now:
- Calls the stored procedure for validation
- Returns success/failure status
- Provides detailed error messages for validation failures
- Returns the inserted record ID on success

### 4. Update Client-Side Validation (Optional)
You can add client-side validation in Angular to provide instant feedback before submission:

```javascript
$scope.validateForm = function() {
    // Check FirstName
    if (!$scope.census.FirstName || $scope.census.FirstName.trim().length < 2) {
        $scope.message = 'FirstName must be at least 2 characters';
        return false;
    }
    // Add similar checks for other fields...
    return true;
};
```

---

## Error Messages

The procedures return detailed error messages for each validation failure:

| Field | Possible Errors |
|-------|-----------------|
| FirstName | "FirstName cannot be empty", "FirstName must be at least 2 characters long", "FirstName cannot exceed 100 characters", "FirstName can only contain letters, spaces, hyphens, and apostrophes" |
| LastName | Similar to FirstName |
| SSN | "SSN cannot be empty", "SSN must be in format XXX-XX-XXXX", "SSN cannot start with 000/666/9", "SSN middle section cannot be 00", "SSN last section cannot be 0000" |
| EmailId | "EmailId cannot be empty", "EmailId cannot exceed 255 characters", "EmailId must be a valid email address", "This email address is already registered" |
| Eid | "Eid cannot be empty", "Eid must contain only numeric characters", "Eid cannot exceed 20 characters", "Eid already exists in the database" |

---

## Sample Test Cases

### Valid Input
```sql
CALL ValidateAndInsertCensus('John', 'Doe', '123-45-6789', 'john.doe@example.com', '12345', 
                              @success, @message, @insertedId);
-- Result: @success = TRUE, @message = 'Census record added successfully'
```

### Invalid Email Format
```sql
CALL ValidateAndInsertCensus('John', 'Doe', '123-45-6789', 'invalid-email', '12345', 
                              @success, @message, @insertedId);
-- Result: @success = FALSE, @message = 'EmailId must be a valid email address'
```

### Invalid SSN Format
```sql
CALL ValidateAndInsertCensus('John', 'Doe', '12345', 'john@example.com', '12345', 
                              @success, @message, @insertedId);
-- Result: @success = FALSE, @message = 'SSN must be in format XXX-XX-XXXX'
```

### Duplicate Eid
```sql
CALL ValidateAndInsertCensus('Jane', 'Doe', '987-65-4321', 'jane@example.com', '12345', 
                              @success, @message, @insertedId);
-- Result: @success = FALSE, @message = 'Eid already exists in the database'
```

---

## Database Table Structure

Ensure your `CensusDetails` table has the following structure:

```sql
CREATE TABLE CensusDetails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    SSN VARCHAR(20) NOT NULL UNIQUE,
    EmailId VARCHAR(255) NOT NULL UNIQUE,
    Eid VARCHAR(50) NOT NULL UNIQUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Performance Considerations

1. **Indexed Columns**: Ensure that SSN, EmailId, and Eid are indexed for faster uniqueness checks
2. **Procedure Compilation**: Stored procedures are compiled once and executed faster than ad-hoc queries
3. **Network Trips**: Using stored procedures reduces the number of round trips to the database
4. **Error Handling**: Built-in error handling prevents partial insertions

---

## Security Features

1. **SQL Injection Prevention**: Parameterized queries prevent SQL injection attacks
2. **Data Validation**: Comprehensive format and content validation
3. **Uniqueness Constraints**: Prevents duplicate entries for sensitive fields
4. **Error Messages**: Descriptive but not overly detailed to avoid information disclosure

---

## Future Enhancements

1. Add phone number validation
2. Add address validation (if fields are added)
3. Add date of birth validation with age requirements
4. Add update procedures with validation
5. Add delete procedures with audit logging
6. Implement sensitive data encryption for SSN storage

