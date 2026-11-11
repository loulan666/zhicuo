import {dimensions} from './curriculum.js';
export const assessmentVersion='foundation-v2';
// Each dimension samples reading, tracing and debugging. V1 remains readable.
const snippets={
 python:['x = 4\ny = x\nx = 9\nprint(y)','x = -2\nprint(x >= 0)','s = 0\nfor i in range(1, 4):\n    s += i\nprint(s)','a = [5, 8, 13]\nprint(a[len(a) - 1])','def twice(x):\n    return x * 2\nprint(twice(3) + 1)'],
 javascript:['let x=4; let y=x; x=9; console.log(y);','let x=-2; console.log(x>=0);','let s=0; for(let i=1;i<4;i++) s+=i; console.log(s);','const a=[5,8,13]; console.log(a[a.length-1]);','function twice(x){return x*2;} console.log(twice(3)+1);'],
 typescript:['let x:number=4; let y:number=x; x=9; console.log(y);','let x:number=-2; console.log(x>=0);','let s:number=0; for(let i=1;i<4;i++) s+=i; console.log(s);','const a:number[]=[5,8,13]; console.log(a[a.length-1]);','function twice(x:number):number{return x*2;} console.log(twice(3)+1);'],
 java:['int x=4; int y=x; x=9; System.out.println(y);','int x=-2; System.out.println(x>=0);','int s=0; for(int i=1;i<4;i++) s+=i; System.out.println(s);','int[] a={5,8,13}; System.out.println(a[a.length-1]);','static int twice(int x){return x*2;}\n// main 中：System.out.println(twice(3)+1);'],
 c:['int x=4; int y=x; x=9; printf("%d",y);','int x=-2; printf("%d",x>=0);','int s=0; for(int i=1;i<4;i++) s+=i; printf("%d",s);','int a[]={5,8,13}; int length=3; printf("%d",a[length-1]);','int twice(int x){return x*2;}\n/* main 中：printf("%d",twice(3)+1); */'],
 cpp:['int x=4; int y=x; x=9; std::cout<<y;','int x=-2; std::cout<<(x>=0);','int s=0; for(int i=1;i<4;i++) s+=i; std::cout<<s;','int a[]={5,8,13}; int length=3; std::cout<<a[length-1];','int twice(int x){return x*2;}\n// main 中：std::cout<<(twice(3)+1);'],
 go:['x := 4; y := x; x = 9; fmt.Println(y, x) // 输出两个值','x := -2; fmt.Println(x >= 0)','s := 0; for i:=1; i<4; i++ {s+=i}; fmt.Println(s)','a := []int{5,8,13}; fmt.Println(a[len(a)-1])','func twice(x int) int {return x*2}\n// main 中：fmt.Println(twice(3)+1)']
};
const debugging=[
 ['计数器每轮都重新设为 0，循环结束后无法得到总次数。应怎样修正？','目标：统计所有满足条件的元素。',['在循环外初始化计数器，循环内按条件递增','每轮将计数器设为 1','只增加循环次数','不知道'],0,'初始化只做一次；把初始化放在循环内会抹掉此前的累计结果。'],
 ['要判断整数处于闭区间 [1, 10]，条件之间应是什么关系？','两个条件：x >= 1 与 x <= 10',['任意一个满足即可','两个条件必须同时满足','只检查 x 不等于 0','不知道'],1,'闭区间要求同时满足下界和上界。只要一个成立会接受区间外的值。'],
 ['循环一直执行，下面哪项最应该先检查？','目标：从 i=0 开始，直到 i 不再小于 n。',['变量名是不是太短','是否打印了足够多的信息','i 是否更新，并最终使继续条件为假','不知道'],2,'循环必须向终止条件推进。检查初值、继续条件与每轮更新是否配合。'],
 ['访问集合的第一个元素之前，应先处理什么情况？','下标从 0 开始。',['集合是否为空','元素是否按升序排列','集合名称是否为 a','不知道'],0,'空集合没有下标 0 的元素。先判断长度，才能安全读取首项。'],
 ['函数需要供其他代码继续计算，哪种做法更合适？','目标：调用方取得计算结果。',['只把结果打印到屏幕','通过返回值交给调用方','把结果写在注释里','不知道'],1,'打印是输出展示；返回值才是调用方可直接使用的函数结果。'],
 ['求非空整数数组的最大值，为什么不能一律用 0 作为初始最大值？','示例输入：[-7, -3, -9]',['0 不能用于比较','会使循环多执行一次','全为负数时会错误地返回不存在的 0','不知道'],2,'处理空输入后，可以用第一个实际元素初始化候选最大值。']
];
export function assessmentQuestions(language,version=assessmentVersion){
 if(version==='foundation-v1')return language.questions;
 if(version!==assessmentVersion)throw Error('INVALID_ASSESSMENT_VERSION');
 const bool=language.id==='python'?'False':['c','cpp'].includes(language.id)?'0':'false';
 const traces=snippets[language.id].map((code,dimension)=>({dimension,prompt:'沿着执行顺序推演，输出是什么？',code,
  options:dimension===0?(language.id==='go'?['9 9','4 9','4 4','不知道']:['9','4','13','不知道']):dimension===1?['true / 1',bool,'报错','不知道']:dimension===2?['3','10','6','不知道']:dimension===3?['13','8','越界','不知道']:['6','8','7','不知道'],
  answer:[1,1,2,0,2][dimension],explanation:['y 保存赋值时的整数值 4；随后修改 x 不改变 y。','负数 -2 不满足大于或等于 0，结果为假。','循环累加 1、2、3，总和为 6。','长度为 3，最后一个合法下标为 2，对应 13。','先计算 twice(3) 得到 6，再加 1 得到 7。'][dimension]}));
 traces.push({dimension:5,prompt:'下面哪组输入最能发现偶数计数中漏算零和负偶数的问题？',code:'需求：统计所有能被 2 整除的整数。',options:['[2, 4, 6]','[1, 3, 5]','[0, -2, 3]','不知道'],answer:2,explanation:'0 和 -2 都是偶数，预期为 2；仅测试正数无法覆盖此问题。'});
 return language.questions.flatMap((question,d)=>[question,traces[d],{dimension:d,prompt:debugging[d][0],code:debugging[d][1],options:debugging[d][2],answer:debugging[d][3],explanation:debugging[d][4]}]).map((q,i)=>({...q,id:`${language.id}:v2:${i}`}));
}
export function gradeAssessment(language,answers,version=assessmentVersion){
 const questions=assessmentQuestions(language,version);
 const counts=dimensions.map((_,d)=>{const indexes=questions.map((q,i)=>q.dimension===d?i:-1).filter(i=>i>=0);return {correct:indexes.filter(i=>answers[i]===questions[i].answer).length,total:indexes.length};});
 const correct=counts.reduce((sum,c)=>sum+c.correct,0),total=questions.length;
 return {version,scores:counts.map(c=>Math.round(c.correct/c.total*100)),counts,correct,total,label:correct/total<=1/3?'建议从基础概念开始':correct/total<=2/3?'已有部分基础，建议专项补练':'基础阅读表现较好，建议编程验证'};
}
export function assessmentCounts(record){
 return record.counts||record.scores.map(score=>({correct:score===100?1:0,total:1}));
}
