import PageTitleComponent from "../../components/PageTitle";
import TransactionsList from "../../components/Transactions";

export default function TransactionsScreen(){
return <div>
    <PageTitleComponent title="Transactions" />
    <TransactionsList/>
</div>
}