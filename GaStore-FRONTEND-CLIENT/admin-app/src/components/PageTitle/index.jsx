const PageTitleComponent = (props) => {
return (
    <div className="border-1 border-gray-200 rounded-lg dark:border-gray-700 mt-5 mb-5">    
    <h4 className="text-lg font-bold text-start text-gray-400 dark:text-gray-500">{props.title}</h4>
    </div>
)
}
export default PageTitleComponent;