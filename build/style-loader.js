// css-loader无所谓是pitch阶段返回还是normal阶段返回无所谓，只需要知道经过css-loader处理的文件最终文件内容是一段esm的js脚本，然后这个脚本导出的是一个css对象（样式字符串）
// css-loader与style-loader配合处理.css文件的执行逻辑：
// 1. style-loader的pitch函数先执行，然后因为return，所以发生熔断，即不执行后面的loader
// 2. style-loader返回的内容就是一段js脚本，这段js脚本的目的就是拿到css-loader处理后的样式字符串
// 3. 通过!!css-loader!xxx.css的形式让css-loader以内联loader的形式处理.css文件，然后我们直接import拿到样式对象（字符串）即可
// 4. 通过创建style标签的形式向header里面添加样式字符串
// 问：既然先执行style-loader的pitch方法，并且pitch返回之后直接熔断，那webpack配置中css-loader存在的意义是什么？
// 答：我们把css-loader作为内联loader去处理.css文件，所以我们要配置css-loader，然后通过remainingRequest访问到css-loader在内存中的位置

module.exports.pitch = function (remainingRequest) {
  // remainingRequest: /xxx/node_modules/css-loader/dist/cjs.js!/xxx/src/styles.css ,此字符串以!分割，!前面表示还未作用的loader，也就是css-loader；!后面表示要处理的文件，即styles.css
  // 这个字符串前面的loader即为内联loader，这个字符串如果被require或者import，那么就可以把它视为一个全新的模块（文件），然后这个模块被loader依次去处理（具体被哪些loader处理，就要看引用此内联loader时的前缀）
  console.log(remainingRequest);
  // 我尝试了一下不进行绝对路径转为相对路径仍然可以正常打包，下面绝对路径转相对路径的逻辑就当认识一下webpack提供的api了
  const relativePath = remainingRequest
    .split("!")
    .map((absolutePath) => {
      // this即为loader的运行环境，this.utils即为webpack提供的功能，this.utils.contextify可依据this.context将绝对路径转换为相对路径
      return this.utils.contextify(this.context, absolutePath);
    })
    .join("!");

  // pitch函数返回了一段js脚本，那么这段js脚本就会被webpack当作一个模块去处理。
  // !!(loader)!(file)这里的loader即为一个内联loader，也就是说，webpack会识别这种(loader)!(file)的结构，表示前面的loader作为内联loader然后去处理后面类型的文件
  // (loader)!(file)前面的!!表示只用内联loader去处理后面的文件(而不用与这个文件类型相匹配的其它loader的文件)
  // 放在当前环境中就是只用css-loader来处理styles.css文件，!!${relativePath}即为处理完成的文件内容
  const script = `
        import style from "!!${relativePath}";
        const styleEl = document.createElement("style");
        styleEl.innerHTML = style;
        document.head.appendChild(styleEl);
    `;

  return script;
};
