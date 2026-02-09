-- Temporarily allow all access during development by making is_authenticated() always return true
-- REVERT THIS when real authentication is implemented
CREATE OR REPLACE FUNCTION public.is_authenticated()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT true
$function$;