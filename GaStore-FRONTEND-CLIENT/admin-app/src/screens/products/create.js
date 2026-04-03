import PageTitleComponent from "../../components/PageTitle";
import CreateProduct from "../../components/Products/Actions/CreateProduct";

export default function CreateProductScreen(){
return <div>
    <PageTitleComponent title="Add Product" />
    <CreateProduct />
</div>
}