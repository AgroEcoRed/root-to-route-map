
CREATE TABLE public.seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL,
  seller_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
ON public.seller_reviews
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Authenticated users can insert reviews"
ON public.seller_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
ON public.seller_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
ON public.seller_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = reviewer_id);
