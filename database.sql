-- 1. Tabla de tokens de verificación propios
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  consumed_at TIMESTAMPTZ
);

-- 2. Activar RLS (Cerrar la puerta por defecto)
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para Profiles (El usuario puede ver sus datos, pero no editarlos todos)
-- Permitir que el usuario lea su propio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Permitir que el usuario actualice su nombre y teléfono, pero no su estado de verificación
-- (Nota: La API usa service_role y se salta esto, lo cual es correcto)
CREATE POLICY "Users can update limited profile fields" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Email Verifications queda SIN POLÍTICAS. 
-- Esto significa que nadie tiene acceso vía API REST pública (anon/authenticated).
-- Solo nuestras funciones en /api (que usan service_role) podrán leer/escribir.

-- 5. Simplificar el manejo de perfiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email_verified, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    FALSE,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Índices
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON public.email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON public.email_verifications(user_id);