ALTER TABLE "SaleListing"
ADD COLUMN "potentialBenefit" INTEGER;

CREATE OR REPLACE FUNCTION public.set_sale_listing_potential_benefit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."resourceStatus" = 'ON_RESOURCES'
     AND NEW."priceInHand" IS NOT NULL
     AND NEW."priceOnResources" IS NOT NULL
     AND NEW."priceOnResources" > NEW."priceInHand" THEN
    NEW."potentialBenefit" := NEW."priceOnResources" - NEW."priceInHand";
  ELSE
    NEW."potentialBenefit" := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sale_listing_set_potential_benefit ON "SaleListing";

CREATE TRIGGER sale_listing_set_potential_benefit
BEFORE INSERT OR UPDATE OF "priceInHand", "priceOnResources", "resourceStatus"
ON "SaleListing"
FOR EACH ROW
EXECUTE FUNCTION public.set_sale_listing_potential_benefit();

UPDATE "SaleListing"
SET "potentialBenefit" = CASE
  WHEN "resourceStatus" = 'ON_RESOURCES'::"ResourceStatus"
   AND "priceInHand" IS NOT NULL
   AND "priceOnResources" IS NOT NULL
   AND "priceOnResources" > "priceInHand"
  THEN "priceOnResources" - "priceInHand"
  ELSE NULL
END;

CREATE INDEX "SaleListing_potentialBenefit_idx"
ON "SaleListing" ("potentialBenefit");
