-- Add age field to physical_assessments table
ALTER TABLE public.physical_assessments 
ADD COLUMN age integer;

-- Update the BMI calculation function to be more comprehensive
CREATE OR REPLACE FUNCTION public.calculate_bmi_with_classification(weight numeric, height numeric)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
    bmi_value numeric;
    classification text;
    risk_level text;
BEGIN
    IF height > 0 AND weight > 0 THEN
        bmi_value := ROUND((weight / (height * height)) * 10000, 1);
        
        -- Classify BMI
        IF bmi_value < 18.5 THEN
            classification := 'Abaixo do peso';
            risk_level := 'baixo';
        ELSIF bmi_value < 25 THEN
            classification := 'Peso normal';
            risk_level := 'normal';
        ELSIF bmi_value < 30 THEN
            classification := 'Sobrepeso';
            risk_level := 'médio';
        ELSIF bmi_value < 35 THEN
            classification := 'Obesidade grau I';
            risk_level := 'alto';
        ELSIF bmi_value < 40 THEN
            classification := 'Obesidade grau II';
            risk_level := 'muito alto';
        ELSE
            classification := 'Obesidade grau III';
            risk_level := 'extremo';
        END IF;
        
        RETURN json_build_object(
            'value', bmi_value,
            'classification', classification,
            'risk_level', risk_level
        );
    ELSE
        RETURN NULL;
    END IF;
END;
$function$;

-- Create trigger to automatically calculate BMI when assessment is inserted or updated
CREATE OR REPLACE FUNCTION public.update_bmi_on_assessment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.weight IS NOT NULL AND NEW.height IS NOT NULL THEN
        NEW.bmi := (SELECT (calculate_bmi_with_classification(NEW.weight, NEW.height))->>'value')::numeric;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_bmi ON public.physical_assessments;
CREATE TRIGGER trigger_update_bmi
    BEFORE INSERT OR UPDATE ON public.physical_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_bmi_on_assessment();