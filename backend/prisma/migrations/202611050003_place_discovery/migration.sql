BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Candidate] ADD [origin] VARCHAR(10) NOT NULL CONSTRAINT [Candidate_origin_df] DEFAULT 'manual';

-- AlterTable
ALTER TABLE [dbo].[Restaurant] ADD [detailsFetchedAt] DATETIME2,
[providerId] VARCHAR(512) NOT NULL CONSTRAINT [Restaurant_providerId_df] DEFAULT '';

-- CreateTable
CREATE TABLE [dbo].[PlaceSearchArea] (
    [key] VARCHAR(100) NOT NULL,
    [refreshedAt] DATETIME2 NOT NULL CONSTRAINT [PlaceSearchArea_refreshedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PlaceSearchArea_pkey] PRIMARY KEY CLUSTERED ([key])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
