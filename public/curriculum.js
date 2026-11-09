export const dimensions=['变量与类型','条件判断','循环推演','集合访问','函数理解','边界意识'];
export const languages=[
 ['python','Python',['x = 3\nx = x + 2\nprint(x)','x = 0\nprint(x > 0)','s = 0\nfor i in range(3):\n    s += i\nprint(s)','a = [10, 20, 30]\nprint(a[1])','def twice(x):\n    return x * 2\nprint(twice(4))'],'False','Python 中缩进决定代码块；range(3) 产生 0、1、2。'],
 ['javascript','JavaScript',['let x = 3; x = x + 2; console.log(x);','const x = 0; console.log(x > 0);','let s = 0; for(let i=0;i<3;i++) s += i; console.log(s);','const a = [10,20,30]; console.log(a[1]);','function twice(x){return x*2;} console.log(twice(4));'],'false','使用 let 声明可变变量、const 声明不可重新赋值的绑定；数组从 0 开始。'],
 ['java','Java',['int x = 3; x = x + 2; System.out.println(x);','int x = 0; System.out.println(x > 0);','int s=0; for(int i=0;i<3;i++) s+=i; System.out.println(s);','int[] a={10,20,30}; System.out.println(a[1]);','static int twice(int x){return x*2;}\n// 在 main 中调用：System.out.println(twice(4));'],'false','片段默认在合法类和 main 上下文中；方法需放在类体。Java 变量具有静态类型。'],
 ['c','C',['int x=3; x=x+2; printf("%d",x);','int x=0; printf("%d",x>0);','int s=0; for(int i=0;i<3;i++) s+=i; printf("%d",s);','int a[]={10,20,30}; printf("%d",a[1]);','int twice(int x){return x*2;}\n/* 在 main 中调用 printf("%d",twice(4)); */'],'0','片段默认具备 stdio.h 和合法 main；C 比较结果为整数 0 或 1。'],
 ['cpp','C++',['int x=3; x=x+2; std::cout << x;','int x=0; std::cout << (x>0);','int s=0; for(int i=0;i<3;i++) s+=i; std::cout << s;','int a[]={10,20,30}; std::cout << a[1];','int twice(int x){return x*2;}\n// 在 main 中调用 std::cout << twice(4);'],'0','片段默认包含 iostream；未设置 boolalpha 时布尔值输出为 0 或 1。'],
 ['typescript','TypeScript',['let x: number=3; x=x+2; console.log(x);','const x: number=0; console.log(x>0);','let s:number=0; for(let i=0;i<3;i++) s+=i; console.log(s);','const a:number[]=[10,20,30]; console.log(a[1]);','function twice(x:number):number{return x*2;} console.log(twice(4));'],'false','TypeScript 增加静态类型检查；这些基础计算的运行语义与 JavaScript 一致。'],
 ['go','Go',['x := 3; x = x + 2; fmt.Println(x)','x := 0; fmt.Println(x > 0)','s := 0; for i:=0; i<3; i++ { s+=i }; fmt.Println(s)','a := []int{10,20,30}; fmt.Println(a[1])','func twice(x int) int { return x*2 }\n// 在 main 中调用 fmt.Println(twice(4))'],'false','片段默认在合法 package/main 中并导入 fmt；函数定义位于包作用域。']
].map(([id,name,code,bool,note])=>({id,name,note,questions:[
 ...code.map((snippet,i)=>({dimension:i,prompt:'这段代码的输出是什么？',code:snippet,options:i===1?[bool,'true / 1','报错','不知道']:i===0?['3','5','32','不知道']:i===2?['3','6','2','不知道']:i===3?['10','20','30','不知道']:['4','8','2','不知道'],answer:[1,0,0,1,1][i],explanation:['先将 3 加 2，再输出更新后的值 5。','0 不严格大于 0，因此条件为假。','循环依次累加 0、1、2，结果为 3。','下标从 0 开始，下标 1 对应第二个元素 20。','将参数 4 乘以 2，返回 8。'][i]})),
 {dimension:5,prompt:'为“统计数组中的正数”设计测试，哪组更能覆盖边界？',code:'需求：只统计严格大于 0 的元素。',options:['仅 [1,2,3]','空数组、含零、含负数、全正数','只测很大的正数','不知道'],answer:1,explanation:'空输入、零和负数分别检验循环与严格比较的边界，正常输入也需要保留。'}
 ]}));
export function assess(language,answers){
 const scores=language.questions.map((q,i)=>Number(answers[i]===q.answer)*100);
 const correct=scores.filter(s=>s===100).length;
 return {scores,correct,total:language.questions.length,label:correct<=2?'建议从基础概念开始':correct<=4?'已有部分基础，建议专项补练':'基础阅读表现较好，建议编程验证'};
}
