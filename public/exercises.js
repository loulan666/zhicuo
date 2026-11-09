const wrappers={
 python:{start:'def solve(numbers):\n    # 返回严格正数的数量\n    return 0',wrap:(code,input)=>`${code}\nprint(solve(${JSON.stringify(input)}))`},
 javascript:{start:'function solve(numbers) {\n  return 0;\n}',wrap:(code,input)=>`${code}\nconsole.log(solve(${JSON.stringify(input)}));`},
 typescript:{start:'function solve(numbers: number[]): number {\n  return 0;\n}',wrap:(code,input)=>`${code}\nconsole.log(solve(${JSON.stringify(input)}));`},
 java:{start:'static int solve(int[] numbers) {\n  return 0;\n}',wrap:(code,input)=>`public class Main { ${code}\npublic static void main(String[] args){System.out.println(solve(new int[]{${input.join(',')}}));}}`},
 c:{start:'int solve(int numbers[], int length) {\n  return 0;\n}',wrap:(code,input)=>`#include <stdio.h>\n${code}\nint main(void){int a[]={${input.length?input.join(','):'0'}};printf("%d",solve(a,${input.length}));return 0;}`},
 cpp:{start:'int solve(const std::vector<int>& numbers) {\n  return 0;\n}',wrap:(code,input)=>`#include <iostream>\n#include <vector>\n${code}\nint main(){std::cout<<solve(std::vector<int>{${input.join(',')}});}`},
 go:{start:'func solve(numbers []int) int {\n  return 0\n}',wrap:(code,input)=>`package main\nimport "fmt"\n${code}\nfunc main(){fmt.Println(solve([]int{${input.join(',')}}))}`}
};
export const exercises=[
 {id:'positive',title:'统计正数',dimensions:[1,2,5],description:'返回严格大于 0 的元素数量。空数组返回 0。',tests:[{input:[1,2,3],expected:3},{input:[-1,0,2],expected:1},{input:[],expected:0},{input:[0,0],expected:0}],hint:['先检查零是否被计数。','严格大于零与大于等于零的边界不同。','遍历数组，只在元素 > 0 时递增计数。']},
 {id:'sum',title:'累加所有元素',dimensions:[0,2,3],description:'返回整数数组的总和。空数组返回 0，负数正常参与求和。',tests:[{input:[1,2,3],expected:6},{input:[-2,2],expected:0},{input:[],expected:0},{input:[8],expected:8}],hint:['检查第一个元素是否参与计算。','累加器从 0 开始，遍历全部元素。','每次将当前元素加入累加器，循环结束返回结果。']},
 {id:'even',title:'偶数计数',dimensions:[1,2,4],description:'返回偶数的数量。0 和负偶数也属于偶数。',tests:[{input:[2,3,4],expected:2},{input:[0,-2,3],expected:2},{input:[],expected:0},{input:[1,5],expected:0}],hint:['不要遗漏零和负偶数。','整数除以 2 余数为 0 时是偶数。','检查取模结果是否等于 0，再递增计数。']},
 {id:'maximum',title:'最大值与空输入',dimensions:[3,4,5],description:'返回数组最大值。为统一跨语言协议，空数组约定返回 0。',tests:[{input:[1,5,2],expected:5},{input:[-7,-3,-9],expected:-3},{input:[],expected:0},{input:[0],expected:0}],hint:['全部为负数时，初值 0 会有什么问题？','先处理空数组，再以真实元素为初始候选。','从第一个元素初始化最大值，逐个比较并更新。']}
];
export const starter=language=>wrappers[language]?.start;
export function wrap(language,code,input){if(!wrappers[language])throw new Error('INVALID_LANGUAGE');return wrappers[language].wrap(code,input);}
