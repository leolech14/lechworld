-- Rename sensitive fields and add nonce columns for encryption
ALTER TABLE member_programs
  RENAME COLUMN pin TO pin_ciphertext;
ALTER TABLE member_programs
  ADD COLUMN IF NOT EXISTS pin_nonce TEXT;

ALTER TABLE member_programs
  RENAME COLUMN account_password TO account_password_ciphertext;
ALTER TABLE member_programs
  ADD COLUMN IF NOT EXISTS account_password_nonce TEXT;
