-- Custom data migration: 6 and 12 beats per bar are compound meters (6/8, 12/8) in this repertoire
-- (e.g. Afro Blue). Before beat_unit existed every tune was shown as N/4.
UPDATE `arrangements` SET `beat_unit` = 8 WHERE `beats_per_bar` IN (6, 12);
