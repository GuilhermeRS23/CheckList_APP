import AddTestes from "../../AddTestes/AddTestes";
import CadastroGrupo from "../Grupos/CadastroGrupo";
import CadastroSubGrupo from "../Grupos/CadastroSubGrupo";

const FormAddTeste = () => {
    return (
        <>
            <CadastroGrupo />
            <CadastroSubGrupo />
            <AddTestes />
        </>
    )
};

export default FormAddTeste;
