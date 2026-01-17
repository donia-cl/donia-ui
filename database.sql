-- 1. Añadir columna a la tabla de perfiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 2. Función para sincronizar el estado de verificación
-- Esta función se ejecuta cada vez que algo cambia en auth.users
CREATE OR REPLACE FUNCTION public.handle_email_verification_sync()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email_verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger para automatizar la sincronización
DROP TRIGGER IF EXISTS on_auth_user_verification_update ON auth.users;
CREATE TRIGGER on_auth_user_verification_update
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_verification_sync();

-- 4. Actualizar perfiles existentes que ya podrían estar confirmados
UPDATE public.profiles p
SET email_verified = TRUE
FROM auth.users u
WHERE p.id = u.id AND u.email_confirmed_at IS NOT NULL;