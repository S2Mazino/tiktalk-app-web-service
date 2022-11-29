--Remove all memebers from all contacts
DELETE FROM Contacts;

--Add Knock & Charles as Friend
INSERT INTO
	Contacts(PrimaryKey, MemberId_A, MemberId_B, Verified)
VALUES
	(DEFAULT, 73, (SELECT MemberId FROM Members WHERE Email='cfb3@uw.edu'), 0),
	(DEFAULT, 75, (SELECT MemberId FROM Members WHERE Email='cfb3@uw.edu'), 0),
	(DEFAULT, 73, (SELECT MemberId FROM Members WHERE Email='team3tiktalk2@gmail.com'), 1),
	(DEFAULT, 75, (SELECT MemberId FROM Members WHERE Email='2twinparadox@gmail.com'), 1),
	--adding dummy friends for team3tiktalk@gmail.com
	(DEFAULT, 76, 1, 1),
	(DEFAULT, 1, 76, 1),
	(DEFAULT, 76, 73, 1),
	(DEFAULT, 73, 76, 1),
	-- bronnyo@uw.edu and team3tiktalk@gmail.com are friends
	(DEFAULT, 76, 89, 1),
	(DEFAULT, 89, 76, 1),
	--team3tiktalk@gmail.com sent friend request to 2twinparadox@gmail.com
	(DEFAULT, 76, 75, 0)
RETURNING *;