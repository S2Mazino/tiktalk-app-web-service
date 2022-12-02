--Remove all memebers from all contacts
DELETE FROM Members;

--Add Knock & Charles as Friend
INSERT INTO
	Members(MemberID, FirstName, LastName, Nickname, Email, Verification)
VALUES
	(1, 'Charles', 'B', 'Charles', 'cfb3@uw.edu', 1),
	(2, 'Team3', 'Tiktalk', 'Team3', 'team3tiktalk@gmail.com', 1),
	(3, 'Team3-2', 'Tiktalk', 'Team3-2', 'team3tiktalk2@gmail.com', 1),
	(4, 'Test', 'Test', 'Test1', 'test@email.test', 1),
	(5, 'bronnyo', 'bronnyo', 'bronnyo', 'bronnyo@uw.edu',1)
RETURNING *;

DELETE FROM Credentials;
