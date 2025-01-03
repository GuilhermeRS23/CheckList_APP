import Button from "../../Button/Button";
import Input from "../../Input/Input";
import Cookies from "js-cookie";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../../services/auth.service";
import { loginSchema } from "../../../schema/loginSchema";
import { ErrorSpan } from "../../../schema/ErrosStyled";
import { useState } from "react";
import Loading from "../../Loading/Loading";

const LoginForm = () => {
    const [login, setLogin] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema)
    });

    const navigate = useNavigate();

    async function onLogin(data) {
        setLogin(true);

        try {
            const response = await loginUser(data);
            Cookies.set("token", response.data.token, { expires: 1 });
            navigate("/");
            console.log(response);

        } catch (error) {
            console.log(error);
            alert(error.response.data)
        } finally {
            setLogin(false);
        };
    };

    return (
        <>
            {login && <Loading />}

            <form onSubmit={handleSubmit(onLogin)}>
                <label htmlFor="email">E-mail</label>
                <Input placeholder="Digite seu e-mail" type="email" name="email" id="email" register={register} />
                {errors.email && <ErrorSpan>{errors.email.message}</ErrorSpan>}

                <label htmlFor="password">Senha</label>
                <Input placeholder="Digite sua senha" type="password" name="password" id="password" register={register} />
                {errors.password && <ErrorSpan>{errors.password.message}</ErrorSpan>}

                <Button type="submit" text="Entrar" />
            </form>
        </>
    )
};

export default LoginForm;
