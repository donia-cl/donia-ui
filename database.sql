-- 1. Asegurar que la tabla profiles existe y tiene la estructura correcta
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  rut TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Función para CREAR el perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email_verified)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    (NEW.email_confirmed_at IS NOT NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger para creación automática
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Función para SINCRONIZAR la verificación de email
CREATE OR REPLACE FUNCTION public.handle_email_verification_sync()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email_verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger para sincronización
DROP TRIGGER IF EXISTS on_auth_user_verification_update ON auth.users;
CREATE TRIGGER on_auth_user_verification_update
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_verification_sync();

-- 6. Actualizar perfiles existentes
UPDATE public.profiles p
SET email_verified = TRUE
FROM auth.users u
WHERE p.id = u.id AND u.email_confirmed_at IS NOT NULL;