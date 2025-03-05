'use client';
import { useState, useMemo } from 'react';
import { Form, Input, Checkbox, Button } from "@heroui/react";

export default function RegistrationForm() {
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState<Record<string, any> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState(false);

  const getPasswordErrors = (value: string): string[] => {
    const errorList: string[] = [];
    if (value.length < 8) errorList.push("Пароль должен содержать не менее 8 символов");
    if ((value.match(/[A-Z]/g) || []).length < 1)
      errorList.push("Пароль должен содержать хотя бы одну заглавную букву");
    if ((value.match(/[a-z]/g) || []).length < 1)
      errorList.push("Пароль должен содержать хотя бы одну строчную букву");
    if ((value.match(/[0-9]/g) || []).length < 1)
      errorList.push("Пароль должен содержать хотя бы одну цифру");
    if (!value.match(/[!@#$%^&*(),.?":{}|<>_]/))
      errorList.push("Пароль должен включать хотя бы один специальный символ");
    if ((value.match(/[^a-z]/gi) || []).length < 1)
      errorList.push("Пароль должен содержать хотя бы один символ");
    return errorList;
  };

  const passwordErrors = useMemo(() => getPasswordErrors(password), [password]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    const newErrors: Record<string, string> = {};

    const formPasswordErrors = getPasswordErrors(data.password as string);
    if (formPasswordErrors.length > 0) {
      newErrors.password = formPasswordErrors.join(", ");
    }

    if (data.name === "admin") {
      newErrors.name = "Хорошая попытка! Выберите другое имя пользователя";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (data.terms !== "true") {
      setErrors({ terms: "Пожалуйста, примите условия" });
      return;
    }

    setErrors({});
    setSubmitted(data);
  };

  return (
    <>
      <h1 className="pb-12 text-center text-[5vh] light:text-gray-900 dark:text-gray-50">
        Регистрация
      </h1>
      <Form
        className="w-full justify-center items-center space-y-10"
        validationErrors={errors}
        onReset={() => setSubmitted(null)}
        onSubmit={onSubmit}
      >
        <div className="flex flex-col gap-4 max-w-md">
          <Input
            isRequired
            errorMessage={({ validationDetails }) => {
              if (validationDetails.valueMissing) return "Пожалуйста, введите ваше имя";
              return errors.name;
            }}
            label="Имя"
            labelPlacement="outside"
            name="name"
            placeholder="Введите имя"
            color="default"
          />

          <Input
            isRequired
            errorMessage={({ validationDetails }) => {
              if (validationDetails.valueMissing) return "Пожалуйста, введите вашу электронную почту";
              if (validationDetails.typeMismatch) return "Пожалуйста, введите корректный адрес электронной почты";
              return;
            }}
            label="Электронная почта"
            labelPlacement="outside"
            name="email"
            placeholder="Введите электронную почту"
            type="email"
            color="default"
          />

          <Input
            isRequired
            errorMessage={() =>
              password && passwordErrors.length !== 0 ? (
                <ul>
                  {passwordErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              ) : null
            }
            isInvalid={passwordErrors.length > 0}
            label="Пароль"
            labelPlacement="outside"
            name="password"
            placeholder="Введите пароль"
            type={isVisible ? "text" : "password"}
            value={password}
            color="default"
            onValueChange={setPassword}
            endContent={
              <button
                aria-label="toggle password visibility"
                className="focus:outline-none"
                type="button"
                onClick={() => setIsVisible((prev) => !prev)}
              >
                {isVisible ? (
                  <img src="Eye.svg" alt="Скрыть пароль" />
                ) : (
                  <img src="Eye-slashed.svg" alt="Показать пароль" />
                )}
              </button>
            }
          />

            <div className="flex items-center gap-1">
              <Checkbox
                isRequired
                color="default"
                classNames={{ label: "text-small" }}
                isInvalid={!!errors.terms}
                name="terms"
                validationBehavior="aria"
                value="true"
                onValueChange={() =>
                  setErrors((prev) => ({ ...prev, terms: undefined as unknown as string }))
                }
              >
                Я согласен с
              </Checkbox>
              <a href="/privacy" className="underline">политикой конфиденциальности</a>
            </div>
          {errors.terms && (
            <span className="text-danger text-small">{errors.terms}</span>
          )}

          <div className="flex gap-4">
            <Button className="w-full" color="default" type="submit">
              Отправить
            </Button>
            <Button type="reset" variant="bordered">
              Сбросить
            </Button>
          </div>
        </div>
        <div className="text-center text-small">
          <a href="/login" className="text-gray-500">Уже есть аккаунт? <b>Войти</b></a>
        </div>
        {submitted && (
          <div className="text-small text-default-500 mt-4">
            Отправленные данные: <pre>{JSON.stringify(submitted, null, 2)}</pre>
          </div>
        )}
      </Form>
    </>
  );
}