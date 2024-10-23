import { useForm } from "react-hook-form";
import { postGrupo } from "../../../services/listaTestes";
import { GruposSchema } from "../../../schema/testesSchema";
import { ErrorSpan } from "../../../schema/ErrosStyled";
import Input from "../../Input/Input";
import { zodResolver } from "@hookform/resolvers/zod/src/zod";

const AddGrupo = () => {
    const { register, handleSubmit, formState: { errors }, setValue } = useForm({
        resolver: zodResolver(GruposSchema)
    });

    // Método para adicionar um novo checklist
    const adicionarChecklist = async (data) => {
        try {
            await postGrupo(data);
        } catch (error) {
            console.log(error)
        }
    };

    return (
        <form onSubmit={handleSubmit(adicionarChecklist)}>
            {/* Botões para adicionar novo checklist e subchecklist */}
            <div className="form-group">
                <Input
                    type="text"
                    className="form-control"
                    placeholder="Novo Grupo..."
                    name="grupo"
                    register={register}
                />
                {errors.grupo && <ErrorSpan>{errors.grupo.message}</ErrorSpan>}
                <button type="submit" className="btn btn-success mt-2">Criar Novo Checklist</button>
            </div>
        </form>
    )
};

export default AddGrupo;
