--Remove all memebers from all contacts
DELETE FROM Contacts;

--Add Knock & Charles as Friend
INSERT INTO
    Contacts(PrimaryKey, MemberId_A, MemberId_B, Verified)
VALUES    
    (DEFAULT, (SELECT MemberId FROM Members WHERE Email='cfb3@uw.edu'), (SELECT MemberId FROM Members WHERE Email='team3tiktalk2@gmail.com'), 1),
    (DEFAULT, (SELECT MemberId FROM Members WHERE Email='team3tiktalk2@gmail.com'), (SELECT MemberId FROM Members WHERE Email='cfb3@uw.edu'), 1)
RETURNING *;