import jsPDF from "jspdf";
import { useContext, useEffect, useState } from "react";
import { deleteTeste, getAllListaTestes, updateTeste } from "../../services/testes.service";
import { getAllGrupos, getAllSubGrupos } from "../../services/grupos.service";
import { BarraDeProgresso } from "./ListagemDosTestesStyled";
import { UserContext } from "../../Context/UserContext";
import { finalizarSessao, iniciarSessao } from "../../services/session.service";
import Loading from "../Loading/Loading";
import LoadingMenor from "../Loading/LoadingMenor";
import AddTestes from "../AddTestes/AddTestes";
import ModalExemple from "../Modal/Modal";


const ListagemDeTestes = () => {
    const { user } = useContext(UserContext);
    const admin = user.admin;
    const [testes, setTestes] = useState([]);
    const [grupo, setGrupo] = useState([]);
    const [subGrupo, setSubGrupo] = useState([]);
    const [atualizar, setAtualizar] = useState(false);
    const [grupoSelecionado, setGrupoSelecionado] = useState(""); // Novo estado para grupo selecionado
    const [subGrupoSelecionado, setSubGrupoSelecionado] = useState(""); // Novo estado para subgrupo selecionado
    const [sessaoAtiva, setSessaoAtiva] = useState(null); // Armazena a sessão ativa
    const [loading, setLoading] = useState(false);
    const [loadingTestes, setLoadingTestes] = useState(false);
    const [visible, setVisible] = useState(false);
    const closeAlert = () => { setVisible(false); };
    const [isOpen, setIsOpen] = useState(false);

    const toggleCollapse = () => {
        setIsOpen(!isOpen);
    };

    // Função para buscar todos os Grupos e SubGrupos
    const findAllGrupos = async () => {
        try {
            const responseG = await getAllGrupos();
            const responseSub = await getAllSubGrupos();
            setGrupo(responseG.data);
            setSubGrupo(responseSub.data);
        } catch (error) {
            console.error("Erro ao carregar grupos e subgrupos:", error);
        }
    };

    // Função para buscar todos os testes
    const findAllTestes = async () => {
        setLoadingTestes(true)
        try {
            const response = await getAllListaTestes();
            setTestes(response.data);
        } catch (error) {
            console.error("Erro ao buscar testes:", error);
        } finally {
            setLoadingTestes(false)
        }
    };

    //Função para Grava o teste no BD
    const gravarTeste = async (id, resultado, observacao) => {
        try {
            if (resultado === "Não Testado" || resultado === undefined) {
                setVisible(true);
                return;
            }
            alert("Teste salvo!");
            const data = { resultado, observacao };
            await updateTeste(id, data);
        } catch (error) {
            console.log(error);
        }
    };

    // Função para resetar os testes
    const resetarTestes = () => {
        setTestes((prevTestes) =>
            prevTestes.map((teste) => ({ ...teste, resultado: 'Não Testado', observacao: '' }))
        );
    };

    // Filtrar os subgrupos com base no grupo selecionado
    const subGruposFiltrados = subGrupo.filter(sg =>
        sg.grupoId === grupoSelecionado || (sg.grupo && sg.grupo._id === grupoSelecionado)
    )

    // Filtragem de itens baseada nos valores dos selects de grupo e subgrupo
    const filteredItems = testes.filter((item) => {
        const grupoValido = grupoSelecionado ? item.grupo._id === grupoSelecionado : true;
        const subGrupoValido = subGrupoSelecionado ? item.subGrupo._id === subGrupoSelecionado : true;
        return grupoValido && subGrupoValido;
    });

    // Função para excluir um teste
    const excluirTeste = async (id) => {
        setLoading(true)
        try {
            await deleteTeste(id);
            alert("Teste excluido com sucesso!")
            setAtualizar(true);
        } catch (error) {
            console.error("Erro ao excluir teste:", error);
        } finally {
            setLoading(false)
        }
    };

    // Função para gerar e salvar PDF com os testes
    const enviarEmailComPDF = () => {
        const doc = new jsPDF();
        doc.text('Checklist de Testes', 10, 10);
        doc.text(`Técnico: ${nomeTecnico}`, 10, 20);

        testes.forEach((teste, index) => {
            doc.text(`${index + 1}. ${teste.tecnico}- ${teste.description} - Resultado: ${teste.resultado} - Observação: ${teste.observacao}`, 10, 30 + index * 10);
        });

        doc.save('checklist.pdf');
    };

    // Função para mudar campo de resultados de um teste
    const handleChange = async (id, e) => {
        try {
            setTestes((prevTestes) =>
                prevTestes.map((teste) =>
                    teste._id === id ? { ...teste, resultado: e.target.value } : teste
                ));
        } catch (error) {
            console.log(error);
        }
    };

    // Função para mudar campo de observações de um teste
    const handleObservationChange = (id, e) => {
        try {
            setTestes((prevTestes) =>
                prevTestes.map((teste) =>
                    teste._id === id ? { ...teste, observacao: e.target.value } : teste
                )
            );
        } catch (error) {
            console.log(error);
        }
    };

    const iniciarTestes = async () => {
        setLoading(true)
        try {
            const response = await iniciarSessao({ grupoId: grupoSelecionado, subGrupoId: subGrupoSelecionado, tecnico: user._id, testes: filteredItems });
            console.log({
                grupo: grupoSelecionado, subGrupo: subGrupoSelecionado, tecnico: user._id, testes: filteredItems
            });
            setSessaoAtiva(response.data); // Armazena a sessão iniciada
            alert('Sessão de testes iniciada!');
        } catch (error) {
            console.error('Erro ao iniciar a sessão de testes:', error);
        } finally {
            setLoading(false)
        }
    };

    const finalizarTestes = async () => {
        setLoading(false)
        try {
            if (!sessaoAtiva) return;

            const sessionId = sessaoAtiva._id; // ID da sessão ativa
            const testesAtualizados = filteredItems.map(teste => ({
                _id: teste._id,
                resultado: teste.resultado,
                observacao: teste.observacao,
            }));

            await finalizarSessao(sessionId, testesAtualizados);
            alert('Sessão de testes finalizada!');
            setSessaoAtiva(null); // Reseta a sessão ativa

        } catch (error) {
            console.error('Erro ao finalizar a sessão de testes:', error);
            alert("Erro ao finalizar a sessão.");
        } finally {
            setLoading(false)
        }
    };

    // Cálculo de progresso dos testes
    const calcularProgresso = () => {
        const totalTestes = filteredItems.length;
        const totalPassou = filteredItems.filter(teste => teste.resultado === 'Passou').length;
        const totalNaoPassou = filteredItems.filter(teste => teste.resultado === 'Não Passou').length;

        const progressoTotal = totalTestes ? (totalPassou / totalTestes) * 100 : 0;
        const passouPercent = totalTestes ? (totalPassou / totalTestes) * 100 : 0;
        const naoPassouPercent = totalTestes ? (totalNaoPassou / totalTestes) * 100 : 0;

        return {
            progressoTotal: progressoTotal.toFixed(2),
            passouPercent: passouPercent.toFixed(2),
            naoPassouPercent: naoPassouPercent.toFixed(2),
            totalPassou,
            totalNaoPassou,
        };
    };
    const { progressoTotal, passouPercent, naoPassouPercent, totalPassou, totalNaoPassou } = calcularProgresso();

    useEffect(() => {
        findAllTestes();
        findAllGrupos();
    }, [atualizar]);

    return (
        <>
            <div className="container mt-4 ">

                <label className="form-label"> <strong>Grupo:</strong></label>
                <select className="form-select" value={grupoSelecionado}
                    onChange={(e) => setGrupoSelecionado(e.target.value)}>
                    <option value="">Todos os Grupos</option>
                    {grupo.map((g) => (
                        <option key={g._id} value={g._id}>{g.nome}</option>
                    ))}
                </select>

                <label className="form-label"><strong>SubGrupo:</strong></label>
                <select
                    className="form-select"
                    value={subGrupoSelecionado}
                    onChange={(e) => setSubGrupoSelecionado(e.target.value)}
                    disabled={!grupoSelecionado} // Desabilita se nenhum grupo estiver selecionado
                >
                    <option value="">Todos os SubGrupos</option>
                    {subGruposFiltrados.map((sg) => (
                        <option key={sg._id} value={sg._id}>{sg.nome}</option>
                    ))}
                </select>
            </div>

            <ModalExemple />

            <div className="mt-4">
                <h3>Progresso dos Testes</h3>
                <BarraDeProgresso width={`${passouPercent}`} tipo="passou" />
                <BarraDeProgresso width={`${naoPassouPercent}`} tipo="naoPassou" />

                <p>Total de Testes: {filteredItems.length}</p>
                <p>Testes que Passaram: {totalPassou} ({passouPercent}%)</p>
                <p>Testes que Não Passaram: {totalNaoPassou} ({naoPassouPercent}%)</p>
            </div>

            <div className="container mt-4">
                {visible && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <strong>ATENÇÃO!</strong> TESTE NÃO FOI FINALIZADO !!!
                        <button type="button" className="btn-close" aria-label="Close" onClick={closeAlert}></button>
                    </div>
                )}
            </div>

            {loadingTestes && <LoadingMenor />}

            <button onClick={iniciarTestes} className="btn btn-success mt-2 space" disabled={!grupoSelecionado || !subGrupoSelecionado || sessaoAtiva || !filteredItems.length}>
                Iniciar Testes
            </button>

            <button className="btn btn-success mt-2 space" disabled={!grupoSelecionado || !subGrupoSelecionado}
                onClick={toggleCollapse}
                aria-expanded={isOpen}
                aria-controls="collapseExample">
                Adicionar teste
            </button>

            {isOpen && <div className="card card-body mt-2">
                <AddTestes
                    grupoFiltro={grupoSelecionado}
                    subGrupoFiltro={subGrupoSelecionado} />
            </div>}

            {filteredItems.length > 0 && !loadingTestes ? (
                <table className="table table-bordered mt-3">
                    <thead>
                        <tr>
                            <th>Grupo</th>
                            <th>Casos de Uso!</th>
                            <th>Resultado</th>
                            <th>Observação</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((teste) => (
                            <tr key={teste._id}>
                                <td>{teste.grupo.nome}</td>
                                <td>{teste.description}</td>
                                <td>
                                    <select
                                        className="form-control"
                                        value={teste.resultado}
                                        onChange={(e) => handleChange(teste._id, e)}
                                        disabled={!sessaoAtiva && !user.admin}
                                    >
                                        <option value="Não Testado">Não Testado</option>
                                        <option value="Passou">Passou</option>
                                        <option value="Não Passou">Não Passou</option>
                                    </select>
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={teste.observacao}
                                        placeholder="Observação"
                                        onChange={(e) => handleObservationChange(teste._id, e)}
                                    />
                                </td>
                                <td>
                                    <button className="btn btn-success space"
                                        onClick={() => gravarTeste(teste._id, teste.resultado, teste.observacao)}
                                    >Gravar</button>
                                    <button className="btn btn-danger space" disabled={!admin} onClick={() => excluirTeste(teste._id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table >
            ) : (
                <p className="list-group-item">Nenhum teste encontrado.</p>
            )}

            {loading && <Loading />}

            <button className="btn btn-danger mt-2 space" onClick={finalizarTestes} disabled={!sessaoAtiva}>
                Finalizar Testes
            </button>
            <button className="btn btn-warning mt-2 space" onClick={resetarTestes}>Resetar Testes</button>
            <button className="btn btn-success mt-2 space" onClick={enviarEmailComPDF}>Gerar PDF</button>
        </>
    );
};

export default ListagemDeTestes;
