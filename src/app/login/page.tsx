'use client';
import { useState } from 'react';
import { Form, Input, Checkbox, Button } from "@heroui/react";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const [submitted, setSubmitted] = useState<Record<string, any> | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData);
        const newErrors: Record<string, string> = {};

        // Простейшая валидация
        if (!data.email) {
            newErrors.email = "Электронная почта обязательна";
        }
        
        if (!data.password) {
            newErrors.password = "Пароль обязателен";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setSubmitted(data);
        // В реальном приложении здесь вы бы выполнили аутентификацию
    };

    return (
        <>
            <h1 className="pb-12 text-center text-[5vh] light:text-gray-900 dark:text-gray-50">
                Вход
            </h1>
            <Form
                className="w-full justify-center items-center space-y-10"
                validationErrors={errors}
                onReset={() => {
                    setSubmitted(null);
                    setEmail("");
                    setPassword("");
                }}
                onSubmit={onSubmit}
            >
                <div className="flex flex-col gap-4 max-w-md">
                    <Input
                        isRequired
                        errorMessage={({ validationDetails }) => {
                            if (validationDetails.valueMissing) return "Пожалуйста, введите вашу электронную почту";
                            if (validationDetails.typeMismatch) return "Пожалуйста, введите действительный адрес электронной почты";
                            return errors.email;
                        }}
                        label="Электронная почта"
                        labelPlacement="outside"
                        name="email"
                        placeholder="Введите вашу электронную почту"
                        type="email"
                        color="default"
                        value={email}
                        onValueChange={setEmail}
                    />

                    <Input
                        isRequired
                        errorMessage={({ validationDetails }) => {
                            if (validationDetails.valueMissing) return "Пожалуйста, введите ваш пароль";
                            return errors.password;
                        }}
                        label="Пароль"
                        labelPlacement="outside"
                        name="password"
                        placeholder="Введите ваш пароль"
                        type={isVisible ? "text" : "password"}
                        value={password}
                        color="default"
                        onValueChange={setPassword}
                        endContent={
                            <button
                                aria-label="переключить видимость пароля"
                                className="focus:outline-none"
                                type="button"
                                onClick={() => setIsVisible((prev) => !prev)}
                            >
                                {isVisible ? (
                                    <img src="Eye.svg" alt="Показать пароль" />
                                ) : (
                                    <img src="Eye-slashed.svg" alt="Скрыть пароль" />
                                )}
                            </button>
                        }
                    />

                    <Checkbox
                        color="default"
                        classNames={{ label: "text-small" }}
                        name="remember"
                        value="true"
                    >
                        Запомнить меня
                    </Checkbox>

                    <div className="flex gap-4">
                        <Button className="w-full" color="default" type="submit">
                            Войти
                        </Button>
                        <Button type="reset" variant="bordered">
                            Сбросить
                        </Button>
                    </div>
                </div>

                {submitted && (
                    <div className="text-small text-default-500 mt-4">
                        Попытка входа: <pre>{JSON.stringify(submitted, null, 2)}</pre>
                    </div>
                )}
            </Form>
            <div className="text-center text-small mt-[5vh]">
                <a href="/reg" className="text-gray-500">
                    Нет аккаунта? <b>Зарегистрироваться</b>
                </a>
            </div>
        </>
    );
}