const processSkill = ({ skill, skills, cache, structure, employeeSkill }) => {
    if (!skill.parent) {
        const notExists = structure.findIndex((i) => i.name === skill.name) === -1;
        if (notExists) {
            structure.push(skill);
        }
        return structure;
    }
    const [ parent ] = skills.filter((s) => s._id.toString() === skill.parent.toString());
    const commonSkill = skill._id.toString() === employeeSkill.skill._id.toString() ? Object.assign(skill, employeeSkill) : skill;
    if (!parent) {
        return structure;
    }
    if (!cache[parent.name]) {
        cache[parent.name] = parent.toObject();
    }
    if (cache[parent.name].childs) {
        cache[parent.name].childs.push(commonSkill);
    } else {
        cache[parent.name].childs = [ commonSkill ];
    }
    return processSkill({ skill: cache[parent.name], skills, cache, structure, employeeSkill });
};

const structureEmployeeSkills = ({ skills, employeeSkills }) => {
    const cache = {};
    const structure = [];
    skills.forEach((skill) => {
        employeeSkills.forEach((employeeSkill) => {
            if (employeeSkill.skill.toString() === skill._id.toString()) {
                processSkill({ skill: skill.toObject(), skills, cache, structure, employeeSkill: employeeSkill.toObject() });
            }
        });
    });
    return structure;
};

/** @function
 * @name structureSkills
 * @param {array} skills all skills
 * @param {(null|string)} parent parent's skill id
 * @returns {array} structure of skills
 * */
const structureSkills = (skills, parent = null) => {
    const structure = [];
    // Generate filter function for skills according to the parent value - null or ObjectId
    const filter = parent === null ? (s) => !s.parent : (s) => s.parent && s.parent.toString() === parent;
    // Apply filter to get the correct items for current itteration
    const items = skills.filter(filter);
    items.forEach((item) => {
        const __item = item.toObject();
        // Get childs for the current item using recursion function
        __item.childs = structureSkills(skills, __item._id.toString());
        structure.push(__item);
    });
    return structure;
};


module.exports = {
    name: 'StructureSkills',
    services: { structureSkills, structureEmployeeSkills }
};
