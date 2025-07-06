/*
	lang.js
	here are functions concerning lanugage as well as the whole translate table
*/

const langService = {
	langs: ['cz', 'en'],
	alias: ['Česky', 'English'],
	default: 'cz',

	//here will be the whole translate table for JS language switch, see below
	table: null,

	//initialize lang using angular module
	init: function() {
		(!CS.lang || this.langs.indexOf(CS.lang) === -1) && (CS.lang = this.default);

		//create directives for HTML language switch
		this.langs.forEach(lang => {
			app.directive(lang, () => ({
				restrict: 'E',
				transclude: true,
				template: '<ng-transclude ng-if="CS.lang === \''+lang+'\'"></ng-transclude>'
			}));
		});

		//JS language switch for String prototype. Pls rate my oneliner evilness!
		String.prototype.trans = function(arg) {
			const curr = CS.lang;
			const val = this.valueOf();
			return (curr === langService.default || !langService.table) ? val : (langService.table[arg || val] || {})[curr] || val;
		}
	},

	//access translation table directly from langService, instead of using String prototype function. ID is required here
	//Not just for strings! Anything can be a value (useful for translated functions).
	trans: function(id) {
		const curr = CS.lang;
		const lst = langService.table;
		if(!lst || !lst[id]) {return null;}
		return lst[id][curr] || lst[id][langService.default] || null;
	}
};

//the translate table
langService.table = {
	'Převést': {en: 'Convert'},
	'Spustit (F2)': {en: 'Run (F2)'},
	'Dále': {en: 'Next'},
	'Zavřít': {en: 'Close'},
	'Dokumentace': {en: 'Documentation'},

	'Konstanta.': {en: 'Constant.'},
	'Základní, ': {en: 'Basic, '},
	'prefixAll': {en: 'all prefixes can be used.'},
	'prefix+': {en: 'usually only increasing prefixes are used.'},
	'prefix-': {en: 'usually only decreasing prefixes are used.'},
	'prefix0': {en: 'prefixes are not used.'},
	'onlyUnitfuns': {en: 'Only use in {curly braces}; see tutorial'},


	//ERRORS 100
	'ERR_brackets_missing': {
		cz: n => `CHYBA 101: Nevyrovnané závorky, ${n} ( chybí`,
		en: n => `ERROR 101: Unbalanced brackets, ${n} ( missing`
	},
	'ERR_operators': {
		cz: str => `CHYBA 102: Více operátorů vedle sebe "${str}"`,
		en: str => `ERROR 102: Several operators next to each other "${str}"`
	},
	'ERR_brackets_empty': {
		cz: 'CHYBA 103: Prázdné závorky ()',
		en: 'ERROR 103: Empty brackets ()'
	},
	'ERR_NaN': {
		cz: str => `CHYBA 104: Nelze zpracovat číslo "${str}"`,
		en: str => `ERROR 104: Cannot parse number "${str}"`
	},
	'ERR_unitPower': {
		cz: str => `CHYBA 105: Nelze zpracovat mocninu jednotky "${str}"`,
		en: str => `ERROR 105: Cannot parse unit power "${str}"`
	},
	'ERR_unknownUnit': {
		cz: str => `CHYBA 106: Neznámá jednotka "${str}"`,
		en: str => `ERROR 106: Unknown unit "${str}"`
	},
	'ERR_operator_misplaced': {
		cz: str => `CHYBA 107: Operátor "${str}" špatně umístěn`,
		en: str => `ERROR 107: Operator "${str}" misplaced`
	},
	'ERR_power_dim': {
		cz: 'CHYBA 108: Mocninou může být pouze bezrozměrné číslo',
		en: 'ERROR 108: Power has to be a dimensionless number'
	},
	'ERR_dim_mismatch': {
		cz: 'CHYBA 109: Nesouhlasí rozměry při sčítání či odčítání',
		en: 'ERROR 109: Dimension mistmatch while addition or subtraction'
	},
	'ERR_special_chars': {
		cz: 'CHYBA 110: Speciální rezervované znaky # ~ nelze používat',
		en: 'ERROR 110: Special reserved characters # ~ not allowed'
	},
	'ERR_cbrackets_missing': {
		cz: 'CHYBA 111: Nevyrovnané složené závorky',
		en: 'ERROR 111: Unbalanced curly brackets'
	},
	'ERR_brackets_mismatch': {
		cz: (open, close) => `CHYBA 112: Nesouhlasí závorky ${open} a ${close}`,
		en: (open, close) => `ERROR 112: Mismatched brackets ${open} and ${close}`
	},
	'ERR_cbrackets_illegal': {
		cz: 'CHYBA 113: Nesprávné použití složených závorek {}, viz tutoriál',
		en: 'ERROR 113: Incorrect use of curly brackets {}, see tutorial'
	},
	'ERR_unknown_unitfun': {
		cz: str => `CHYBA 114: Jednotka ${str} nemá k dispozici {} funkci`,
		en: str => `ERROR 114: Unit ${str} does not have a {} function`
	},
	'ERR_cbrackets_dim_mismatch': {
		cz: str => `CHYBA 115: Nesouhlasí rozměry vstupu s cílovou jednotkou ${str}`,
		en: str => `ERROR 115: Dimension mismatch of input with target unit ${str}`
	},
	'ERR_NaN_result': {
		cz: 'CHYBA 116: Zakázaná matematická operace',
		en: 'ERROR 116: Illegal math operation'
	},
    
    //We did not translate the english message to cz, but it should be fine. Somebody can fix this someday if they wish to.
	'ERR_custom_units_mismatch': {
		cz: 'CHYBA 117: Custom units in angle brackets (<>) must be the same for input and target units.',
		en: 'ERROR 117: Custom units in angle brackets (<>) must be the same for input and target units.'
	},

	//WARNINGS 200
	'WARN_prefixes': {
		cz: (unit, word, pref) => `VAROVÁNÍ 201: Jednotka ${unit.id} (${unit.name[CS.lang]}) většinou nemívá ${word} předpony, avšak nalezeno ${pref.id}`,
		en: (unit, word, pref) => `WARNING 201: Unit ${unit.id} (${unit.name[CS.lang]}) doesn\'t usually have ${word} prefixes, yet ${pref.id} identified`
	},
	'WARN_prefixes_word0': {cz: 'žádné', en: 'any'},
	'WARN_prefixes_word+': {cz: 'zmenšující', en: 'decreasing'},
	'WARN_prefixes_word-': {cz: 'zvětšující', en: 'increasing'},
	'WARN_target_dim_mismatch': {
		cz: faults => 'VAROVÁNÍ 202: Rozměry jednotek ze vstupu a cíle nesouhlasí. Tyto základní jednotky byly přidány: ' + faults.join(', '),
		en: faults => 'WARNING 202: Dimensions of units from input and target don\'t match. These basic units have been added: ' + faults.join(', ')
	},
	'WARN_targetNumber': {
		cz: 'VAROVÁNÍ 203: Neočekávané číslo v cílovém poli, ale bude s ním tedy počítáno',
		en: 'WARNING 203: Unexpected number in the target field, but it will included in calculation'
	},
	'WARN_separators': {
		cz: 'VAROVÁNÍ 204: Nalezeno příliš mnoho oddělovačů cílových jednotek (>, to nebo into). Pouze první definice cílových jednotek byla akceptována.',
		en: 'WARNING 204: Too many target unit separators have been found (>, to or into). Only the first definiton of target units was accepted.'
	},
	'WARN_curly_prefix': {
		cz: 'VAROVÁNÍ 205: Ignorován prefix v složených závorkách {}',
		en: 'WARNING 205: Prefix ignored in curly braces {}'
	},
	'WARN_format_params': {
		cz: 'VAROVÁNÍ 206: Formátovací parametry z adresy nebylo možné přečíst',
		en: 'WARNING 206: Format params from address could not be parsed'
	},


	//MACRO CODE ERRORS 300
	'ERRC_equalSigns': {
		cz: line => 'CHYBA KÓDU 301: Více rovnítek na jednom řádku: ' + line,
		en: line => 'CODE ERROR 301: Several equal signs on one line: ' + line
	},
	'ERRC_varName': {
		cz: (line, varName) => `CHYBA KÓDU 302: Neplatný název proměnné "${varName}": ` + line,
		en: (line, varName) => `CODE ERROR 302: Invalid variable name "${varName}": ` + line
	},
	'ERRC_argCount': {
		cz: (line, fName, argsMin, argsMax, args) => `CHYBA KÓDU 303: Funkce "${fName}" požaduje ${argsMin}–${argsMax} argumentů, avšak nalezeno ${args}: ` + line,
		en: (line, fName, argsMin, argsMax, args) => `CODE ERROR 303: Function "${fName}" requires ${argsMin}–${argsMax} arguments, but ${args} found: ` + line
	},
	'ERRC_unreadableLine': {
		cz: line => 'CHYBA KÓDU 304: Řádek nečitelný: ' + line,
		en: line => 'CODE ERROR 304: Line unreadable: ' + line
	},


	//what kind of project would it be without an easter egg?
	'ERR_Secret': {
		cz: 'Tajný Error, gratuluju! Čeho tímto vůbec chcete dosáhnout? Inverzní funkce k logaritmu je _e^(číslo)',
		en: 'Secret Error, congratz! What are you even trying to do? Inverse function of logarithm is _e^(number)'
	}
};
