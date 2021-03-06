/*
1. create root
2. add first item to the root
it can be:
 * listItem                      |- 'a'
 * list in list                  |-
 * property                      |prop: 123
 * new list or object            |prop:
3. change the path where to add next item based on whitespace

*/
const _ = require('lodash')

module.exports = (()=>{
    let root = null;
    let patterns = {
        listItem: /\s{0,}-(.*)/,
        property: /\s{0,}(.*?):(.*)/,
    }
    let listLevels = []
    let path = []
    let firstRun = true;

    function processLine(line){ 
        if(line.trim() === ''){
            return;
        }
        let parsedLine = getDescription(line)
        path = popToTheLevel(parsedLine.level, path)
        path.push(String(parsedLine.description.key))
        if(firstRun){
            switch(parsedLine.description.type){
                case "listitem":
                    root = []
                    break;
                case "property":
                    root = {}
                    break;
                case "simple":
                    root = parsedLine.description.value
            }
            firstRun = false;
        }
        _.set(root, path, mapValue(parsedLine.description.value));
    }

    function mapValue(value){
        if(value === null){
            return value
        }
        value = String(value).trim()
        let valuePatterns = {
            null: /^null/,
            number: /^-{0,1}\s{0,}[0-9]{1,}\.{0,}[0-9]{0,}/,
            boolTrue: /^true/,
            boolFalse: /^false/,
            string: /^'(.*)'/
        }
        if(valuePatterns.string.test(value)){
            return valuePatterns.string.exec(value)[1]
        }
        if(valuePatterns.null.test(value)){
            return null
        }
        if(valuePatterns.number.test(value)){
            return Number(value)
        }
        if(valuePatterns.boolTrue.test(value)){
            return true
        }
        if(valuePatterns.boolFalse.test(value)){
            return false
        }  
    }

    function getDescription(line){
        let description = getLineDescription(line);
        let level = getNumOfWhitespaces(line)/2
        listLevels = popListToTheLevel(level, listLevels)
        if(description.type === 'listitem'){
            description.key = listLevels[level] === undefined ? 0 : listLevels[level] + 1;
            listLevels[level] = description.key;
        }
        return {
            level,
            description
        }
    }

    function popListToTheLevel(level, list){
        let pops = list.length -1 - level
        for(let i =0; i< pops; i++){
            list.pop()
        }
        return list
    }

    function popToTheLevel(level, list){
        let pops = list.length - level
        for(let i =0; i< pops; i++){
            list.pop()
        }
        return list
    }

    function getNumOfWhitespaces(line){
        let characters = line.split('')
        let num = 0
        for(let i =0; i<characters.length; i++){
            if(characters[i]===' '){
                num ++
            }else{
                return num;
            }
        }
        return num
    }

    function getLineDescription(line){
        let propertyResult = patterns.property.exec(line)
        if(propertyResult){
            return {
                type: 'property',
                key: propertyResult[1].trim(),
                value: propertyResult[2].trim() === '' ? null : propertyResult[2].trim()
            }
        }

        let listItemResult = patterns.listItem.exec(line)
        if(listItemResult){
            return {
                type: 'listitem',
                value: listItemResult[1].trim() === '' ? undefined : listItemResult[1].trim()
            }
        }

        if(firstRun){
            let simple = mapValue(line)
            if(simple !== undefined){
                return {
                    type: 'simple',
                    value: simple
                }
            }
        }
    
        let error = `provided line '${line}' is not a list item or property`
        throw new Error(error)      
    }

    function getResult(){
        return root;
    }

    return {
        processLine,
        getResult
    }
})