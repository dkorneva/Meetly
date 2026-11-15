BEGIN TRY
BEGIN TRAN;

-- Existing prices are preserved. Incomplete records must be fixed before migration.
IF EXISTS (SELECT 1 FROM [dbo].[Restaurant] WHERE [price] IS NULL)
    THROW 50002, 'Restaurant price is required. Fill missing prices before migration.', 1;

DROP INDEX [Restaurant_catalogArea_price_idx] ON [dbo].[Restaurant];
ALTER TABLE [dbo].[Restaurant] ALTER COLUMN [price] INT NOT NULL;
CREATE NONCLUSTERED INDEX [Restaurant_catalogArea_price_idx]
    ON [dbo].[Restaurant]([catalogArea], [price]);

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH
