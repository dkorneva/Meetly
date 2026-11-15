BEGIN TRY
BEGIN TRAN;

-- Do not remove restaurants referenced by existing meetings or candidates.
IF EXISTS (
    SELECT 1 FROM [dbo].[Restaurant] r
    WHERE r.[catalogActive] = 0 AND (
        EXISTS (SELECT 1 FROM [dbo].[Candidate] c WHERE c.[restaurantId] = r.[id])
        OR EXISTS (SELECT 1 FROM [dbo].[Meeting] m WHERE m.[restaurantId] = r.[id])
    )
)
    THROW 50001, 'Cannot remove hidden restaurants referenced by meetings.', 1;

-- Related cuisine rows are removed by the existing cascading foreign key.
DELETE FROM [dbo].[Restaurant] WHERE [catalogActive] = 0;

DROP INDEX [Restaurant_catalogArea_catalogActive_price_idx] ON [dbo].[Restaurant];
ALTER TABLE [dbo].[Restaurant] DROP CONSTRAINT [Restaurant_catalogActive_df];
ALTER TABLE [dbo].[Restaurant] DROP COLUMN [catalogActive];
CREATE NONCLUSTERED INDEX [Restaurant_catalogArea_price_idx]
    ON [dbo].[Restaurant]([catalogArea], [price]);

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH
