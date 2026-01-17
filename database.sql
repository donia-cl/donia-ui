-- 1. Función optimizada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email_verified)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    -- email_verified será FALSE inicialmente si "Confirm Email" está ON
    (NEW.email_confirmed_at IS NOT NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email_verified = (NEW.email_confirmed_at IS NOT NULL);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Script de reparación (Ejecutar esto una vez para corregir registros previos)
UPDATE public.profiles p
SET email_verified = FALSE
FROM auth.users u
WHERE p.id = u.id 
AND u.email_confirmed_at IS NULL;