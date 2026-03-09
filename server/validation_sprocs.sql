-- Stored Procedures for Census Form Validation

-- 1. Validate FirstName
DELIMITER $$
CREATE PROCEDURE ValidateFirstName(
    IN p_FirstName VARCHAR(100),
    OUT p_IsValid BOOLEAN,
    OUT p_ErrorMessage VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'Database error occurred during FirstName validation';
    END;

    SET p_IsValid = TRUE;
    SET p_ErrorMessage = '';

    -- Check if FirstName is NULL or empty
    IF p_FirstName IS NULL OR TRIM(p_FirstName) = '' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'FirstName cannot be empty';
    -- Check if FirstName length is between 2 and 100
    ELSEIF LENGTH(TRIM(p_FirstName)) < 2 THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'FirstName must be at least 2 characters long';
    ELSEIF LENGTH(TRIM(p_FirstName)) > 100 THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'FirstName cannot exceed 100 characters';
    -- Check if FirstName contains only letters and spaces
    ELSEIF p_FirstName REGEXP '[^a-zA-Z\s\'-]' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'FirstName can only contain letters, spaces, hyphens, and apostrophes';
    END IF;
END$$
DELIMITER ;

-- 2. Validate LastName
DELIMITER $$
CREATE PROCEDURE ValidateLastName(
    IN p_LastName VARCHAR(100),
    OUT p_IsValid BOOLEAN,
    OUT p_ErrorMessage VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'Database error occurred during LastName validation';
    END;

    SET p_IsValid = TRUE;
    SET p_ErrorMessage = '';

    -- Check if LastName is NULL or empty
    IF p_LastName IS NULL OR TRIM(p_LastName) = '' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'LastName cannot be empty';
    -- Check if LastName length is between 2 and 100
    ELSEIF LENGTH(TRIM(p_LastName)) < 2 THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'LastName must be at least 2 characters long';
    ELSEIF LENGTH(TRIM(p_LastName)) > 100 THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'LastName cannot exceed 100 characters';
    -- Check if LastName contains only letters and spaces
    ELSEIF p_LastName REGEXP '[^a-zA-Z\s\'-]' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'LastName can only contain letters, spaces, hyphens, and apostrophes';
    END IF;
END$$
DELIMITER ;

-- 3. Validate SSN (Social Security Number)
DELIMITER $$
CREATE PROCEDURE ValidateSSN(
    IN p_SSN VARCHAR(20),
    OUT p_IsValid BOOLEAN,
    OUT p_ErrorMessage VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'Database error occurred during SSN validation';
    END;

    SET p_IsValid = TRUE;
    SET p_ErrorMessage = '';

    -- Check if SSN is NULL or empty
    IF p_SSN IS NULL OR TRIM(p_SSN) = '' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'SSN cannot be empty';
    -- Check if SSN matches the format XXX-XX-XXXX
    ELSEIF p_SSN NOT REGEXP '^[0-9]{3}-[0-9]{2}-[0-9]{4}$' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'SSN must be in format XXX-XX-XXXX';
    -- Check for invalid SSN values (all zeros or invalid area numbers)
    ELSEIF SUBSTRING(p_SSN, 1, 3) = '000' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'SSN cannot start with 000';
    ELSEIF SUBSTRING(p_SSN, 1, 3) = '666' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'SSN cannot start with 666';
    ELSEIF SUBSTRING(p_SSN, 1, 1) = '9' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'SSN cannot start with 9';
    ELSEIF SUBSTRING(p_SSN, 5, 2) = '00' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'SSN middle section cannot be 00';
    ELSEIF SUBSTRING(p_SSN, 8, 4) = '0000' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'SSN last section cannot be 0000';
    END IF;
END$$
DELIMITER ;

-- 4. Validate Email
DELIMITER $$
CREATE PROCEDURE ValidateEmailId(
    IN p_EmailId VARCHAR(255),
    OUT p_IsValid BOOLEAN,
    OUT p_ErrorMessage VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'Database error occurred during Email validation';
    END;

    SET p_IsValid = TRUE;
    SET p_ErrorMessage = '';

    -- Check if EmailId is NULL or empty
    IF p_EmailId IS NULL OR TRIM(p_EmailId) = '' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'EmailId cannot be empty';
    -- Check if EmailId length exceeds 255 characters
    ELSEIF LENGTH(TRIM(p_EmailId)) > 255 THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'EmailId cannot exceed 255 characters';
    -- Check if EmailId matches valid email format
    ELSEIF p_EmailId NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'EmailId must be a valid email address';
    END IF;
END$$
DELIMITER ;

-- 5. Validate Eid (Employee ID)
DELIMITER $$
CREATE PROCEDURE ValidateEid(
    IN p_Eid VARCHAR(50),
    OUT p_IsValid BOOLEAN,
    OUT p_ErrorMessage VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'Database error occurred during Eid validation';
    END;

    SET p_IsValid = TRUE;
    SET p_ErrorMessage = '';

    -- Check if Eid is NULL or empty
    IF p_Eid IS NULL OR TRIM(p_Eid) = '' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'Eid cannot be empty';
    -- Check if Eid is numeric
    ELSEIF p_Eid NOT REGEXP '^[0-9]+$' THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'Eid must contain only numeric characters';
    -- Check if Eid length is reasonable (between 1 and 20)
    ELSEIF LENGTH(TRIM(p_Eid)) > 20 THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'Eid cannot exceed 20 characters';
    -- Check if Eid already exists
    ELSEIF EXISTS (SELECT 1 FROM CensusDetails WHERE Eid = p_Eid) THEN
        SET p_IsValid = FALSE;
        SET p_ErrorMessage = 'Eid already exists in the database';
    END IF;
END$$
DELIMITER ;

-- 6. Comprehensive Validation and Insert Procedure
DELIMITER $$
CREATE PROCEDURE ValidateAndInsertCensus(
    IN p_FirstName VARCHAR(100),
    IN p_LastName VARCHAR(100),
    IN p_SSN VARCHAR(20),
    IN p_EmailId VARCHAR(255),
    IN p_Eid VARCHAR(50),
    OUT p_Success BOOLEAN,
    OUT p_Message VARCHAR(1000),
    OUT p_InsertedId INT
)
BEGIN
    DECLARE v_FirstNameValid BOOLEAN;
    DECLARE v_LastNameValid BOOLEAN;
    DECLARE v_SSNValid BOOLEAN;
    DECLARE v_EmailValid BOOLEAN;
    DECLARE v_EidValid BOOLEAN;
    DECLARE v_FirstNameError VARCHAR(500);
    DECLARE v_LastNameError VARCHAR(500);
    DECLARE v_SSNError VARCHAR(500);
    DECLARE v_EmailError VARCHAR(500);
    DECLARE v_EidError VARCHAR(500);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        SET p_Success = FALSE;
        SET p_Message = 'Database error occurred during insert operation';
        SET p_InsertedId = NULL;
    END;

    SET p_Success = FALSE;
    SET p_Message = '';
    SET p_InsertedId = NULL;

    -- Validate all fields
    CALL ValidateFirstName(p_FirstName, v_FirstNameValid, v_FirstNameError);
    CALL ValidateLastName(p_LastName, v_LastNameValid, v_LastNameError);
    CALL ValidateSSN(p_SSN, v_SSNValid, v_SSNError);
    CALL ValidateEmailId(p_EmailId, v_EmailValid, v_EmailError);
    CALL ValidateEid(p_Eid, v_EidValid, v_EidError);

    -- Check if all validations passed
    IF NOT v_FirstNameValid THEN
        SET p_Message = v_FirstNameError;
    ELSEIF NOT v_LastNameValid THEN
        SET p_Message = v_LastNameError;
    ELSEIF NOT v_SSNValid THEN
        SET p_Message = v_SSNError;
    ELSEIF NOT v_EmailValid THEN
        SET p_Message = v_EmailError;
    ELSEIF NOT v_EidValid THEN
        SET p_Message = v_EidError;
    ELSE
        -- All validations passed, insert the record
        INSERT INTO CensusDetails (FirstName, LastName, SSN, EmailId, Eid)
        VALUES (TRIM(p_FirstName), TRIM(p_LastName), p_SSN, LOWER(TRIM(p_EmailId)), p_Eid);
        
        SET p_InsertedId = LAST_INSERT_ID();
        SET p_Success = TRUE;
        SET p_Message = 'Census record added successfully';
    END IF;
END$$
DELIMITER ;

-- 7. Validate Email Uniqueness
DELIMITER $$
CREATE PROCEDURE ValidateEmailUniqueness(
    IN p_EmailId VARCHAR(255),
    OUT p_IsUnique BOOLEAN,
    OUT p_ErrorMessage VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        SET p_IsUnique = FALSE;
        SET p_ErrorMessage = 'Database error occurred during email uniqueness validation';
    END;

    SET p_IsUnique = TRUE;
    SET p_ErrorMessage = '';

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM CensusDetails WHERE LOWER(EmailId) = LOWER(p_EmailId)) THEN
        SET p_IsUnique = FALSE;
        SET p_ErrorMessage = 'This email address is already registered';
    END IF;
END$$
DELIMITER ;

-- 8. Validate SSN Uniqueness
DELIMITER $$
CREATE PROCEDURE ValidateSSNUniqueness(
    IN p_SSN VARCHAR(20),
    OUT p_IsUnique BOOLEAN,
    OUT p_ErrorMessage VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        SET p_IsUnique = FALSE;
        SET p_ErrorMessage = 'Database error occurred during SSN uniqueness validation';
    END;

    SET p_IsUnique = TRUE;
    SET p_ErrorMessage = '';

    -- Check if SSN already exists
    IF EXISTS (SELECT 1 FROM CensusDetails WHERE SSN = p_SSN) THEN
        SET p_IsUnique = FALSE;
        SET p_ErrorMessage = 'This SSN is already registered in the system';
    END IF;
END$$
DELIMITER ;
