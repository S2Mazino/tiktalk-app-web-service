--Remove all memebers from all contacts
DELETE FROM Contacts;

--Add Knock & Charles as Friend
INSERT INTO
	Contacts(PrimaryKey, MemberId_A, MemberId_B, Verified)
VALUES
	(1, 1, (SELECT MemberId FROM Members WHERE Email='team3tiktalk@gmail.com'), 1),
	(2, 1, (SELECT MemberId FROM Members WHERE Email='team3tiktalk2@gmail.com'), 1),
	(3, 1, (SELECT MemberId FROM Members WHERE Email='2twinparadox@gmail.com'), 1),
	(4, 2, (SELECT MemberId FROM Members WHERE Email='team3tiktalk2@gmail.com'), 1),
	(5, 2, (SELECT MemberId FROM Members WHERE Email='2twinparadox@gmail.com'), 1),
	(6, 2, (SELECT MemberId FROM Members WHERE Email='bronnyo@uw.edu'), 1),
	(7, 5, (SELECT MemberId FROM Members WHERE Email='cfb3@uw.edu'), 1),
	(8, 5, (SELECT MemberId FROM Members WHERE Email='2twinparadox@gmail.com'), 1)
	
RETURNING *;