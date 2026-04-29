-- Add AI features configuration column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_features JSONB DEFAULT '{}';
