--Remove all memebers from all contacts
DELETE FROM Contacts;

--Add Knock & Charles as Friend
INSERT INTO
	Contacts(PrimaryKey, MemberId_A, MemberId_B, Verified)
VALUES	
	(DEFAULT, 12, (SELECT MemberId FROM Members WHERE Email='team3tiktalk2@gmail.com'), 1),
	(DEFAULT, 12, (SELECT MemberId FROM Members WHERE Email='cfb3@uw.edu'), 1),
	--bronson and team3 friends
	(DEFAULT, 14, 15, 1),
	(DEFAULT, 15, 14, 1),
	--team3 outgoing request
	(DEFAULT, 15, 1, 0),
	--team3 incoming request
	(DEFAULT, 12, 15, 0)
RETURNING *;